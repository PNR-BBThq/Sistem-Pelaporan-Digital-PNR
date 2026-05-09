// ==========================================
// FAIL: js/dashboard.js
// FUNGSI: Mengemaskini UI Dashboard, Pengiraan KPI & Analisis Pintar
// ==========================================

const DashboardManager = {

    initDash: async function() {
        const isOffline = !navigator.onLine;
        const cachedRaw = localStorage.getItem('pnr_dashboard_data');
        const cachedTime = localStorage.getItem('pnr_dashboard_time');

        if (isOffline && !cachedRaw) {
            document.getElementById('smartSummary').innerHTML = '<div class="alert alert-danger">Tiada sambungan internet & tiada data simpanan.</div>';
            return; 
        }

        if (isOffline || cachedRaw) {
            try {
                AppState.mData = JSON.parse(cachedRaw);
                DashboardManager.processDataToUI(AppState.mData);
                DashboardManager.updateLastUpdateLabel(cachedTime, false);
            } catch(e) { console.error(e); }
        }

        if (!isOffline) {
            try {
                const d = await API.postData('getAnalytics', {state: AppState.uProf.state});
                if (d.records) {
                    AppState.mData = d.records;
                    localStorage.setItem('pnr_dashboard_data', JSON.stringify(AppState.mData));
                    const now = new Date().toLocaleString('en-MY', { hour12: true });
                    localStorage.setItem('pnr_dashboard_time', now);
                    
                    DashboardManager.processDataToUI(AppState.mData);
                    DashboardManager.updateLastUpdateLabel(now, true);
                }
            } catch (e) { console.log("Gagal tarik data server"); }
        }
    },

    processDataToUI: function(dataList) {
        const currentN = FilterManager.v('selNegeri'); 
        FilterManager.fillSel('selNegeri', dataList.map(d => d.n).filter((val, i, a) => a.indexOf(val) === i).sort(), 'n');
        
        if(AppState.uProf.state !== "ALL") { 
            const cbList = document.querySelectorAll('.chk-selNegeri');
            cbList.forEach(cb => {
                if(cb.value === AppState.uProf.state) { cb.checked = true; cb.disabled = true; }
                else { cb.checked = false; cb.disabled = true; } 
            });
            const btn = document.getElementById('btnselNegeri');
            if(btn) { btn.innerText = AppState.uProf.state; btn.classList.add('disabled', 'bg-light'); }
        } else if (currentN.length > 0) {
            document.querySelectorAll('.chk-selNegeri').forEach(cb => { if(currentN.includes(cb.value)) cb.checked = true; }); 
            FilterManager.updateBtnText('selNegeri');
        }

        MapManager.initMap();
        FilterManager.runFilter('n');
    },

    updateLastUpdateLabel: function(timeStr, isOnline) {
        const el = document.getElementById('lastUpdate');
        if (isOnline) {
            el.innerHTML = `<span class="text-success"><i class="bi bi-cloud-check-fill"></i> Data Terkini: ${timeStr}</span>`;
        } else {
            el.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-clock-history"></i> Data Offline (${timeStr || "Tiada Tarikh"})</span>`;
        }
    },

    calcUI: function() {
        let tt=0, ts=0, pm={}, km={1:0,2:0,3:0,4:0,5:0}, pts=[], hData={};
        
        AppState.fData.forEach(d => {
            tt += (d.lt||0); 
            ts += (d.ls||0);
            try{ 
                let p=typeof d.p==='string'?JSON.parse(d.p):d.p; 
                if(p) Object.entries(p).forEach(([k,v])=>pm[k]=(pm[k]||0)+parseFloat(v)); 
                else if(d.ls>0) pm["Umum"]=(pm["Umum"]||0)+d.ls; 
            } catch(e){ 
                if(d.ls>0) pm["Umum"]=(pm["Umum"]||0)+d.ls; 
            }
            let l = parseInt(d.k)||0; 
            if(l>0 && l<=5) km[l]++;
            
            if(d.c && d.c.includes(',')) { 
                let p = d.c.split(',').map(Number); 
                if(p.length===2 && !isNaN(p[0])) pts.push({ coord: p, data: d }); 
            }
            if(d.ls > 0 && d.d !== "-") hData[d.d] = (hData[d.d]||0) + d.ls;
        });

        // Update KPI Cards (Kita generate terus dari sini supaya HTML bersih)
        const peratus = tt > 0 ? ((ts/tt)*100).toFixed(1)+"%" : "0%";
        document.getElementById('kpiCardsContainer').innerHTML = `
            <div class="col-6 col-md-3"><div class="kpi-card"><div class="d-flex justify-content-between mb-2"><span class="kpi-title">Luas Bancian</span><div class="kpi-icon bg-success-subtle text-success"><i class="bi bi-rulers"></i></div></div><div class="kpi-value">${tt.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div><small class="text-muted fw-bold">Hektar</small></div></div>
            <div class="col-6 col-md-3"><div class="kpi-card"><div class="d-flex justify-content-between mb-2"><span class="kpi-title">Luas Serangan</span><div class="kpi-icon bg-danger-subtle text-danger"><i class="bi bi-bug-fill"></i></div></div><div class="kpi-value text-danger">${ts.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div><small class="text-muted fw-bold">Hektar</small></div></div>
            <div class="col-6 col-md-3"><div class="kpi-card"><div class="d-flex justify-content-between mb-2"><span class="kpi-title">Peratus Serangan</span><div class="kpi-icon bg-warning-subtle text-warning"><i class="bi bi-percent"></i></div></div><div class="kpi-value">${peratus}</div><small class="text-muted fw-bold">Kadar Jangkitan</small></div></div>
            <div class="col-6 col-md-3"><div class="kpi-card"><div class="d-flex justify-content-between mb-2"><span class="kpi-title">Bil. Rekod</span><div class="kpi-icon bg-primary-subtle text-primary"><i class="bi bi-file-text"></i></div></div><div class="kpi-value">${AppState.fData.length.toLocaleString('en-US')}</div><small class="text-muted fw-bold">Unit Data</small></div></div>
        `;

        if (typeof ChartManager !== 'undefined') ChartManager.updateCharts(pm, km); 
        MapManager.updateMap(pts); 
        DashboardManager.updateHotspot(hData); 
        DashboardManager.genSummary(pm, tt, ts); 
        DashboardManager.renTab();
    },

    updateHotspot: function(hData) { 
        const s = Object.entries(hData).sort((a,b)=>b[1]-a[1]).slice(0,5); 
        document.getElementById('hotspotTable').innerHTML = s.length ? s.map(x=>`<tr><td>${x[0]}</td><td class="text-end fw-bold text-danger">${x[1].toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="2" class="text-center text-muted">Tiada Data</td></tr>'; 
    },

    genSummary: function(pm, tt, ts) {
        const el = document.getElementById('smartSummary');
        if (!el) return;
        if (ts === 0 || AppState.fData.length === 0) { el.innerHTML = `<div class="d-flex align-items-center"><div class="bg-light rounded-circle p-3 me-3 text-secondary"><i class="bi bi-robot fs-2"></i></div><div><h6 class="text-primary fw-bold mb-1">Analisis Pintar</h6><span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Tiada rekod serangan dilaporkan setakat ini.</span></div></div>`; return; }
        
        let locGroups = {};
        AppState.fData.forEach(d => {
            const locKey = d.l; const ls = parseFloat(d.ls) || 0; const lt = parseFloat(d.lt) || 0;
            if (ls > 0) {
                if (!locGroups[locKey]) { locGroups[locKey] = { name: locKey, negeri: d.n, daerah: d.d, totalLS: 0, totalLT: 0, crops: {}, pests: {}, severitySum: 0, count: 0 }; }
                let g = locGroups[locKey]; 
                g.totalLS += ls; g.totalLT += lt; g.count++; g.severitySum += (parseInt(d.k) || 0); g.crops[d.tn] = (g.crops[d.tn] || 0) + ls;
                try { let pObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p; if (pObj) Object.entries(pObj).forEach(([pN, pA]) => g.pests[pN] = (g.pests[pN] || 0) + (parseFloat(pA)||0)); } catch (e) {}
            }
        });

        const sortedLocs = Object.values(locGroups).sort((a, b) => b.totalLS - a.totalLS);
        if (sortedLocs.length === 0) { el.innerHTML = "Data tidak mencukupi."; return; }
        
        const topLoc = sortedLocs[0];
        const topCropEntry = Object.entries(topLoc.crops).sort((a,b) => b[1] - a[1])[0]; const topCrop = topCropEntry ? topCropEntry[0] : "Tanaman";
        const topPestEntry = Object.entries(topLoc.pests).sort((a,b) => b[1] - a[1])[0]; const topPest = topPestEntry ? topPestEntry[0] : "Perosak";
        const avgSev = topLoc.count > 0 ? (topLoc.severitySum / topLoc.count).toFixed(1) : "0.0";
        
        let score = parseFloat(avgSev), sevText = "Rendah", sevColor = "#22c55e";
        if (score >= 4.5) { sevText = "Sangat Teruk"; sevColor = "#ef4444"; } else if (score >= 4.0) { sevText = "Teruk"; sevColor = "#f97316"; } else if (score >= 3.0) { sevText = "Sederhana"; sevColor = "#eab308"; } else if (score >= 2.0) { sevText = "Rendah"; sevColor = "#84cc16"; }
        
        let locPct = topLoc.totalLT > 0 ? ((topLoc.totalLS / topLoc.totalLT) * 100).toFixed(2) : "0.00";
        el.innerHTML = `<div class="d-flex align-items-start"><div class="d-none d-sm-flex bg-white shadow-sm border rounded-circle p-3 me-4 align-items-center justify-content-center" style="width: 60px; height: 60px; flex-shrink: 0;"><i class="bi bi-robot fs-3 text-primary"></i></div><div style="flex-grow: 1;"><h6 class="text-primary fw-bold mb-3">Analisis Pintar</h6><div class="mb-2" style="font-size: 0.95rem;"><i class="bi bi-geo-alt-fill text-danger me-2"></i> Lokasi Hotspot: <b class="text-uppercase text-dark">${topLoc.daerah}, ${topLoc.negeri}</b></div><div class="mb-2" style="font-size: 0.95rem; line-height: 1.5;"><i class="bi bi-flower1 text-success me-2"></i> Tanaman <b class="text-uppercase text-dark">${topCrop}</b> paling terkesan akibat serangan <b class="text-uppercase text-dark">${topPest}</b></div><div class="mb-2" style="font-size: 0.95rem;"><i class="bi bi-exclamation-circle-fill text-warning me-2"></i> Luas Serangan: <b class="text-dark">${topLoc.totalLS.toFixed(2)} Ha</b> <span class="text-muted">(${locPct}%)</span></div><div style="font-size: 0.95rem;"><i class="bi bi-bar-chart-fill me-2" style="color: ${sevColor}"></i> Indeks Keterukan: <b class="text-dark">${avgSev}</b> - <span style="color: ${sevColor}; font-weight: bold;">${sevText}</span></div></div></div>`;
    },

    renTab: function() { 
        const st = (AppState.pg-1)*AppState.pSize; 
        const dt = AppState.fData.slice(st, st+AppState.pSize); 
        
        document.getElementById('tBody').innerHTML = dt.length ? dt.map((d, i) => { 
            const realIndex = st + i; 
            return `
            <tr style="cursor: pointer;" title="Klik baris untuk butiran" onclick="DataManager.viewRec(${realIndex})">
                <td>${Utils.formatDateDisplay(d.t)}</td>
                <td>${d.n}</td>
                <td>${d.l}</td>
                <td><span class="badge bg-light text-dark border">${d.tn}</span></td>
                <td>${d.lt.toFixed(2)}</td>
                <td class="text-danger fw-bold">${d.ls.toFixed(2)}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-danger" 
                    data-lokasi="${d.l}" data-pegawai="${d.pg}" data-coord="${d.c}" data-tarikh="${d.t}" 
                    onclick="event.stopPropagation(); ExportManager.klikJanaPDF(this)">
                    <i class="bi bi-file-earmark-pdf-fill"></i> PDF
                </button>
                </td>
            </tr>`; 
        }).join('') : '<tr><td colspan="7" class="text-center text-muted p-4">Tiada rekod.</td></tr>'; 
        
        document.getElementById('pgInfo').innerText = `Page ${AppState.pg}`; 
    },
    
    movePg: function(v) { 
        AppState.pg = Math.max(1, AppState.pg+v); 
        this.renTab(); 
    }
};

// Utils: Fungsi bantuan (tarikh, dsb) diletakkan di dalam objek Utils
const Utils = {
    formatDateDisplay: function(dateStr) {
        if (!dateStr || dateStr === "-") return "-";
        let str = String(dateStr).trim();
        if (str.includes('-')) {
            const parts = str.split('T')[0].split('-'); 
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        if (str.includes('/')) return str; 
        const d = new Date(dateStr);
        if (isNaN(d)) return str; 
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
};
