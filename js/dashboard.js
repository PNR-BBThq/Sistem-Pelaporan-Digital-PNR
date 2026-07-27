// ==========================================
// FAIL: js/dashboard.js
// FUNGSI: Mengemaskini UI Dashboard, Pengiraan KPI & Analisis Pintar (Berserta Multi-Column Sorting)
// REDESIGN: Visual upgrade — glassmorphism cards, animated counters, premium styling
// ==========================================

const DashboardManager = {
    // Sediakan memori penanda isihan jadual
    currentSortCol: null,
    currentSortDir: 'asc',
    quickSearchTerm: "",

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
                    if (typeof TaskManager !== 'undefined') {
                        TaskManager.checkTaskCount(); 
                    }
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
            if(d.ls > 0 && d.d && d.d !== "-") {
                let dKey = `${d.d} (<small class='text-muted'>${d.n}</small>)`;
                hData[dKey] = (hData[dKey]||0) + d.ls;
            }
        });

        const peratus = tt > 0 ? ((ts/tt)*100).toFixed(1)+"%" : "0%";
        
        // Pengiraan Indeks Keterukan Purata (Average Severity Score)
        let sevSum = 0, sevCount = 0;
        Object.entries(km).forEach(([lvl, count]) => {
            sevSum += (parseInt(lvl) * count);
            sevCount += count;
        });
        let avgSevScore = sevCount > 0 ? (sevSum / sevCount).toFixed(1) : "0.0";
        let sevLabel = "Rendah", sevBadgeClass = "bg-success-subtle text-success";
        if (parseFloat(avgSevScore) >= 4.0) { sevLabel = "Kritikal (T4-T5)"; sevBadgeClass = "bg-danger-subtle text-danger"; }
        else if (parseFloat(avgSevScore) >= 3.0) { sevLabel = "Sederhana (T3)"; sevBadgeClass = "bg-warning-subtle text-warning-emphasis"; }
        else if (parseFloat(avgSevScore) >= 2.0) { sevLabel = "Rendah (T2)"; sevBadgeClass = "bg-info-subtle text-info-emphasis"; }
        else if (parseFloat(avgSevScore) > 0) { sevLabel = "Sangat Rendah (T1)"; sevBadgeClass = "bg-success-subtle text-success"; }

        // Pengiraan Kategori Tanaman Paling Terjejas
        let topCat = "Tiada", maxCatLS = 0;
        let catStats = {};
        AppState.fData.forEach(d => {
            if (parseFloat(d.ls) > 0) {
                let cat = (d.kt || "LAIN-LAIN").toUpperCase().trim();
                catStats[cat] = (catStats[cat] || 0) + parseFloat(d.ls);
                if (catStats[cat] > maxCatLS) {
                    maxCatLS = catStats[cat];
                    topCat = cat;
                }
            }
        });
        if (maxCatLS === 0) topCat = "Terkawal / Tiada";

        // Pengiraan Pegawai Aktif
        let uniqPegawai = new Set(AppState.fData.filter(d => d.pg && d.pg !== "-").map(d => d.pg)).size;
        let rekodSerangan = AppState.fData.filter(d => parseFloat(d.ls) > 0).length;

        const kpiContainer = document.getElementById('kpiCardsContainer');
        if (kpiContainer) {
            kpiContainer.innerHTML = `
                <div class="col-12 col-sm-6 col-xl-4">
                    <div class="kpi-modern-card border-primary-card kpi-animate">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="kpi-modern-title"><i class="bi bi-rulers me-1"></i>Luas Bancian Keseluruhan</span>
                                <div class="kpi-modern-val" style="color: var(--primary);">${tt.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <small class="fs-6 text-muted fw-bold">Ha</small></div>
                            </div>
                            <div class="kpi-modern-icon" style="background: var(--primary-subtle); color: var(--primary);"><i class="bi bi-rulers"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-geo-fill me-1" style="color: var(--primary);"></i> Liputan pemantauan aktif</span>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-4">
                    <div class="kpi-modern-card border-danger-card kpi-animate" style="animation-delay: 0.08s;">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="kpi-modern-title"><i class="bi bi-bug me-1"></i>Luas Serangan Disahkan</span>
                                <div class="kpi-modern-val text-danger">${ts.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <small class="fs-6 text-muted fw-bold">Ha</small></div>
                            </div>
                            <div class="kpi-modern-icon bg-danger-subtle text-danger"><i class="bi bi-bug-fill"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-exclamation-triangle-fill text-danger me-1"></i> ${rekodSerangan.toLocaleString('en-US')} rekod terjejas dilaporkan</span>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-4">
                    <div class="kpi-modern-card border-warning-card kpi-animate" style="animation-delay: 0.16s;">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="kpi-modern-title"><i class="bi bi-activity me-1"></i>Kadar Jangkitan Perosak</span>
                                <div class="kpi-modern-val text-dark">${peratus}</div>
                            </div>
                            <div class="kpi-modern-icon bg-warning-subtle text-warning-emphasis"><i class="bi bi-activity"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-pie-chart-fill text-warning me-1"></i> Nisbah serangan atas luas tanam</span>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-4">
                    <div class="kpi-modern-card border-info-card kpi-animate" style="animation-delay: 0.24s;">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="kpi-modern-title"><i class="bi bi-speedometer2 me-1"></i>Indeks Keterukan Purata</span>
                                <div class="kpi-modern-val text-dark">${avgSevScore} <small class="fs-6 text-muted fw-bold">/ 5.0</small></div>
                            </div>
                            <div class="kpi-modern-icon bg-info-subtle text-info-emphasis"><i class="bi bi-speedometer2"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small border-top pt-2">
                            <span class="badge ${sevBadgeClass} fw-bold">${sevLabel}</span>
                            <span class="text-muted small">Tahap amaran purata</span>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-4">
                    <div class="kpi-modern-card border-indigo-card kpi-animate" style="animation-delay: 0.32s;">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="kpi-modern-title"><i class="bi bi-flower3 me-1"></i>Kategori Paling Terjejas</span>
                                <div class="kpi-modern-val text-dark text-truncate" style="max-width: 195px;" title="${topCat}">${topCat}</div>
                            </div>
                            <div class="kpi-modern-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;"><i class="bi bi-flower3"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-fire text-danger me-1"></i> <b>${maxCatLS.toFixed(2)} Ha</b> diserang dalam sektor ini</span>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-4">
                    <div class="kpi-modern-card kpi-animate" style="border-left-color: var(--success); animation-delay: 0.4s;">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="kpi-modern-title"><i class="bi bi-person-badge me-1"></i>Jumlah Rekod & Pegawai</span>
                                <div class="kpi-modern-val text-success">${AppState.fData.length.toLocaleString('en-US')} <small class="fs-6 text-muted fw-bold">Unit</small></div>
                            </div>
                            <div class="kpi-modern-icon bg-success-subtle text-success"><i class="bi bi-person-badge-fill"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-people-fill text-success me-1"></i> <b>${uniqPegawai}</b> Pegawai PNR aktif bertugas</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (typeof ChartManager !== 'undefined') ChartManager.updateCharts(pm, km); 
        MapManager.updateMap(pts); 
        DashboardManager.updateHotspot(hData); 
        DashboardManager.renderWatchlist();
        DashboardManager.genSummary(pm, tt, ts); 
        
        if (this.currentSortCol) {
            this.reExecuteSort();
        } else {
            DashboardManager.renTab();
        }
    },

    renderWatchlist: function() {
        const container = document.getElementById('watchlistContainer');
        if (!container) return;

        const targetPests = [
            { id: "FAW", name: "Fall Armyworm (FAW)", keywords: ["FAW", "FALL ARMYWORM", "ULAT RATUS"], color: "danger" },
            { id: "RPW", name: "Red Palm Weevil (RPW)", keywords: ["RPW", "RED PALM WEEVIL", "KUMBANG MERAH"], color: "danger" },
            { id: "ORYCTES", name: "Kumbang Tanduk", keywords: ["ORYCTES", "KUMBANG TANDUK", "RHINOCEROS"], color: "warning" },
            { id: "KOYA", name: "Koya (Mealybug)", keywords: ["KOYA", "MEALYBUG", "MEALY BUG"], color: "info" },
            { id: "LIRIOMYZA", name: "Liriomyza / Apogonia", keywords: ["LIRIOMYZA", "APOGONIA", "PELOMBONG DAUN"], color: "warning" }
        ];

        let pestStats = {};
        targetPests.forEach(p => pestStats[p.id] = { totalArea: 0, districts: {} });

        AppState.fData.forEach(d => {
            try {
                let pObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p;
                if (pObj) {
                    Object.entries(pObj).forEach(([pestName, area]) => {
                        let pUpper = String(pestName).toUpperCase().trim();
                        let areaVal = parseFloat(area) || 0;
                        if (areaVal > 0) {
                            targetPests.forEach(t => {
                                if (t.keywords.some(k => pUpper.includes(k))) {
                                    pestStats[t.id].totalArea += areaVal;
                                    let distKey = `${d.d || '-'}, ${d.n || '-'}`;
                                    pestStats[t.id].districts[distKey] = (pestStats[t.id].districts[distKey] || 0) + areaVal;
                                }
                            });
                        }
                    });
                }
            } catch (e) {}
        });

        let html = "";
        targetPests.forEach(t => {
            let stats = pestStats[t.id];
            let topDist = "Tiada Jangkitan";
            if (Object.keys(stats.districts).length > 0) {
                let sorted = Object.entries(stats.districts).sort((a,b) => b[1] - a[1]);
                topDist = sorted[0][0];
            }
            
            let statusBadge = stats.totalArea > 0 
                ? `<span class="badge bg-danger text-white fw-bold" style="font-size: 0.68rem;"><i class="bi bi-exclamation-octagon-fill me-1"></i> AKTIF (${stats.totalArea.toFixed(2)} Ha)</span>`
                : `<span class="badge bg-success-subtle text-success border border-success-subtle fw-bold" style="font-size: 0.68rem;"><i class="bi bi-shield-check me-1"></i> TERKAWAL</span>`;

            html += `
            <div class="col-12 col-sm-6 col-lg-4 col-xl">
                <div class="pest-chip-box d-flex flex-column justify-content-between h-100 shadow-sm">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-${t.color}-subtle text-dark border fw-bold text-uppercase" style="font-size: 0.68rem;">${t.id}</span>
                            ${statusBadge}
                        </div>
                        <h6 class="fw-bold text-dark mb-1 text-truncate" title="${t.name}">${t.name}</h6>
                        <div class="small text-muted mb-2" style="font-size: 0.78rem;"><i class="bi bi-geo-alt-fill text-danger me-1"></i> Hotspot #1: <b class="text-dark">${topDist}</b></div>
                    </div>
                    <div class="progress mt-2" style="height: 5px; border-radius: 6px; background-color: #f1f5f9;">
                        <div class="progress-bar bg-${stats.totalArea > 0 ? 'danger' : 'success'}" role="progressbar" style="width: ${stats.totalArea > 0 ? Math.min(100, Math.max(15, (stats.totalArea / 10) * 100)) : 100}%; transition: width 0.6s ease;"></div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    },

    updateHotspot: function(hData) { 
        const s = Object.entries(hData).sort((a,b)=>b[1]-a[1]).slice(0,5); 
        let maxVal = s.length > 0 ? s[0][1] : 1;
        document.getElementById('hotspotTable').innerHTML = s.length ? s.map((x, idx)=>`
            <tr style="transition: all 0.2s ease;">
                <td><span class="badge bg-light text-secondary border me-2" style="font-size: 0.7rem;">#${idx+1}</span> <span class="fw-bold text-dark text-uppercase" style="font-size: 0.85rem;">${x[0]}</span></td>
                <td class="text-end">
                    <div class="fw-bold text-danger">${x[1].toFixed(2)} <small class="text-muted">Ha</small></div>
                    <div class="progress ms-auto mt-1" style="height: 4px; width: 70px; background-color: #e2e8f0; border-radius: 10px;">
                        <div class="progress-bar bg-danger" style="width: ${Math.min(100, (x[1]/maxVal)*100)}%; border-radius: 10px; transition: width 0.5s ease;"></div>
                    </div>
                </td>
            </tr>`).join('') : '<tr><td colspan="2" class="text-center text-muted py-5"><i class="bi bi-geo-slash fs-2 d-block text-secondary mb-2"></i>Tiada rekod hotspot serangan dicatatkan.</td></tr>'; 
    },

    genSummary: function(pm, tt, ts) {
        const el = document.getElementById('smartSummary');
        if (!el) return;
        if (ts === 0 || AppState.fData.length === 0) { 
            el.innerHTML = `
            <div class="d-flex align-items-center justify-content-between p-2">
                <div class="d-flex align-items-center">
                    <div class="bg-success-subtle text-success rounded-circle p-3 me-3 fs-3 d-flex align-items-center justify-content-center" style="width: 54px; height: 54px;"><i class="bi bi-shield-check-fill"></i></div>
                    <div>
                        <span class="insight-pill mb-1"><i class="bi bi-cpu-fill" style="color: var(--primary);"></i> AI Executive Insights</span>
                        <h6 class="fw-bold text-dark mb-0">Status Tanaman Terkawal & Aman</h6>
                        <span class="text-muted small">Tiada laporan penularan wabak perosak aktif direkodkan di dalam tempoh mahupun penapis terpilih ini.</span>
                    </div>
                </div>
                <span class="badge bg-success text-white px-3 py-2 fw-bold shadow-sm d-none d-md-inline-block"><i class="bi bi-check2-circle me-1"></i> BIOSEKURITI AMAN</span>
            </div>`; 
            return; 
        }
        
        let locGroups = {}, cropGroups = {}, pestGroups = {};
        AppState.fData.forEach(d => {
            const ls = parseFloat(d.ls) || 0; const lt = parseFloat(d.lt) || 0;
            if (ls > 0) {
                const locKey = `${d.d || '-'}, ${d.n || '-'}`;
                if (!locGroups[locKey]) { locGroups[locKey] = { name: locKey, daerah: d.d || '-', negeri: d.n || '-', totalLS: 0, totalLT: 0, count: 0, sevSum: 0 }; }
                let g = locGroups[locKey]; 
                g.totalLS += ls; g.totalLT += lt; g.count++; g.sevSum += (parseInt(d.k) || 1);
                
                cropGroups[d.tn] = (cropGroups[d.tn] || 0) + ls;
                try { 
                    let pObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p; 
                    if (pObj) Object.entries(pObj).forEach(([pN, pA]) => pestGroups[pN] = (pestGroups[pN] || 0) + (parseFloat(pA)||0)); 
                } catch (e) {}
            }
        });

        const sortedLocs = Object.values(locGroups).sort((a, b) => b.totalLS - a.totalLS);
        const sortedCrops = Object.entries(cropGroups).sort((a,b) => b[1] - a[1]);
        const sortedPests = Object.entries(pestGroups).sort((a,b) => b[1] - a[1]);
        
        if (sortedLocs.length === 0) { el.innerHTML = "Data tidak mencukupi."; return; }
        
        const topLoc = sortedLocs[0];
        const topCrop = sortedCrops.length > 0 ? sortedCrops[0][0] : "Tanaman";
        const topCropLS = sortedCrops.length > 0 ? sortedCrops[0][1] : 0;
        const topPest = sortedPests.length > 0 ? sortedPests[0][0] : "Perosak Umum";
        const avgSev = topLoc.count > 0 ? (topLoc.sevSum / topLoc.count).toFixed(1) : "1.0";
        
        let score = parseFloat(avgSev), sevText = "Rendah", sevColor = "#10b981", alertBadge = "AMARAN AWAL", alertBg = "warning";
        if (score >= 4.0) { sevText = "Kritikal (T4 - T5)"; sevColor = "#ef4444"; alertBadge = "AMARAN MERAH"; alertBg = "danger"; } 
        else if (score >= 3.0) { sevText = "Sederhana (T3)"; sevColor = "#f59e0b"; alertBadge = "TINDAKAN SEGERA"; alertBg = "warning"; } 
        else if (score >= 2.0) { sevText = "Rendah (T2)"; sevColor = "#6366f1"; alertBadge = "PEMANTAUAN RUTIN"; alertBg = "info"; }
        
        let locPct = topLoc.totalLT > 0 ? ((topLoc.totalLS / topLoc.totalLT) * 100).toFixed(1) : "0.0";

        el.innerHTML = `
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-3 gap-2 border-bottom pb-3">
            <div class="d-flex align-items-center">
                <div class="rounded-3 p-3 me-3 fs-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 52px; height: 52px; background: var(--primary-subtle); color: var(--primary);"><i class="bi bi-robot"></i></div>
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="insight-pill"><i class="bi bi-stars text-warning"></i> AI Executive Insights</span>
                        <span class="badge bg-${alertBg}-subtle text-${alertBg} fw-bold border border-${alertBg}-subtle">${alertBadge}</span>
                    </div>
                    <h5 class="fw-bold text-dark mb-0" style="letter-spacing: -0.3px;">Rumusan Sintesis Bancian & Amaran Risiko</h5>
                </div>
            </div>
            <span class="small text-muted fw-bold"><i class="bi bi-cloud-check-fill me-1" style="color: var(--primary);"></i> Dituai secara LIVE dari pangkalan data PNR</span>
        </div>

        <div class="row g-3">
            <div class="col-md-4">
                <div class="insight-sub-card border-start border-danger border-4 d-flex flex-column justify-content-between">
                    <div>
                        <span class="text-uppercase small fw-bold text-muted d-block mb-1" style="font-size: 0.72rem;"><i class="bi bi-geo-alt-fill text-danger me-1"></i> Titik Panas Utama (#1 Hotspot)</span>
                        <h5 class="fw-bold text-dark text-uppercase mb-2">${topLoc.name}</h5>
                        <div class="d-flex align-items-baseline gap-2">
                            <span class="fs-4 fw-bold text-danger">${topLoc.totalLS.toFixed(2)} <small class="fs-6 text-muted">Ha</small></span>
                            <span class="badge bg-light text-secondary border">(${(topLoc.totalLS / ts * 100).toFixed(1)}% dari total)</span>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-3 pt-2 border-top" style="font-size: 0.8rem;">Kadar jangkitan kawasan: <b class="text-dark">${locPct}%</b> atas luas bancian</small>
                </div>
            </div>

            <div class="col-md-4">
                <div class="insight-sub-card border-start border-warning border-4 d-flex flex-column justify-content-between">
                    <div>
                        <span class="text-uppercase small fw-bold text-muted d-block mb-2" style="font-size: 0.72rem;"><i class="bi bi-bug-fill text-warning me-1"></i> Ancaman Terbesar (Tanaman & Perosak)</span>
                        <div class="mb-2">
                            <small class="text-muted d-block" style="font-size: 0.7rem;">TANAMAN PALING TERJEJAS:</small>
                            <span class="fw-bold text-dark text-uppercase fs-6 d-block text-truncate" title="${topCrop}">${topCrop} (${topCropLS.toFixed(2)} Ha)</span>
                        </div>
                    </div>
                    <div class="pt-2 border-top">
                        <small class="text-muted d-block" style="font-size: 0.7rem;">PEROSAK PENYUMBANG UTAMA:</small>
                        <span class="fw-bold text-danger text-uppercase fs-6 d-block text-truncate" title="${topPest}"><i class="bi bi-exclamation-triangle-fill me-1"></i> ${topPest}</span>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="insight-sub-card border-start border-4 d-flex flex-column justify-content-between" style="border-color: var(--primary) !important;">
                    <div>
                        <span class="text-uppercase small fw-bold text-muted d-block mb-1" style="font-size: 0.72rem;"><i class="bi bi-shield-lock-fill me-1" style="color: var(--primary);"></i> Indeks Keterukan & Syor Tindakan</span>
                        <div class="d-flex align-items-center gap-2 my-2">
                            <span class="fs-4 fw-bold text-dark">${avgSev} <small class="fs-6 text-muted">/ 5.0</small></span>
                            <span class="badge shadow-sm" style="background-color: ${sevColor}; color: white; font-size: 0.75rem; font-weight: 800;">${sevText}</span>
                        </div>
                    </div>
                    <div class="mt-2 pt-2 border-top small text-dark" style="line-height: 1.4; font-size: 0.8rem;">
                        <i class="bi bi-lightning-charge-fill text-warning me-1"></i>
                        <b>Syor Eksekutif:</b> Tingkatkan kawalan sanitasi ladang & pemasangan perangkap di <b>${topLoc.daerah}</b> bagi mengawal penularan <b>${topPest}</b>.
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    handleTableSearch: function() {
        const inputEl = document.getElementById('tableQuickSearch');
        this.quickSearchTerm = inputEl ? inputEl.value.trim().toLowerCase() : "";
        AppState.pg = 1;
        this.renTab();
    },

    renTab: function() { 
        let filtered = AppState.fData;
        if (this.quickSearchTerm) {
            const q = this.quickSearchTerm;
            filtered = AppState.fData.filter(d => {
                const searchStr = `${d.t || ''} ${d.n || ''} ${d.d || ''} ${d.l || ''} ${d.tn || ''} ${d.vr || ''} ${d.kt || ''} ${d.pg || ''} ${d.em || ''} ${d.p || ''}`.toLowerCase();
                return searchStr.includes(q);
            });
        }

        const totalRecs = filtered.length;
        const totalPgs = Math.max(1, Math.ceil(totalRecs / AppState.pSize));
        if (AppState.pg > totalPgs) AppState.pg = totalPgs;

        const st = (AppState.pg-1)*AppState.pSize; 
        const dt = filtered.slice(st, st+AppState.pSize); 
        
        document.getElementById('tBody').innerHTML = dt.length ? dt.map((d, i) => { 
            const realOrigIndex = AppState.fData.indexOf(d); 
            
            let ltVal = parseFloat(d.lt) || 0;
            let lsVal = parseFloat(d.ls) || 0;
            let pct = ltVal > 0 ? Math.min(100, (lsVal / ltVal) * 100).toFixed(1) : "0.0";
            let barColor = parseFloat(pct) >= 50 ? "bg-danger" : (parseFloat(pct) >= 20 ? "bg-warning" : "bg-success");
            
            let pestBadges = "";
            try {
                let pObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p;
                let sevObj = typeof d.pk === 'string' ? JSON.parse(d.pk) : (d.pk || {});
                if (pObj && Object.keys(pObj).length > 0) {
                    Object.keys(pObj).forEach(pestName => {
                        let lvl = sevObj[pestName] ? sevObj[pestName] : (d.k || 1);
                        pestBadges += `<span class="badge-sev badge-t${lvl} me-1 mb-1" title="Luas Serangan: ${parseFloat(pObj[pestName]||0).toFixed(2)} Ha">${pestName} (T${lvl})</span>`;
                    });
                } else if (lsVal > 0) {
                    let lvl = d.k || 1;
                    pestBadges = `<span class="badge-sev badge-t${lvl}">Serangan Umum (T${lvl})</span>`;
                } else {
                    pestBadges = `<span class="badge bg-light text-muted border">Tiada Serangan</span>`;
                }
            } catch (e) {
                pestBadges = `<span class="badge bg-light text-secondary border">Rekod Umum</span>`;
            }

            let initials = (d.pg && d.pg !== "-" && d.pg.length > 1) ? d.pg.substring(0, 2).toUpperCase() : "PG";

            return `
            <tr style="cursor: pointer;" title="Klik baris untuk butiran penuh" onclick="DataManager.viewRec(${realOrigIndex > -1 ? realOrigIndex : (st+i)})">
                <td class="text-nowrap">
                    <div class="fw-bold text-dark">${Utils.formatDateDisplay(d.t)}</div>
                    <small class="text-muted d-block" style="font-size: 0.72rem;"><i class="bi bi-clock me-1"></i>Bancian PNR</small>
                </td>
                <td>
                    <div class="fw-bold text-uppercase" style="font-size: 0.92rem; color: var(--primary);">${d.l}</div>
                    <div class="small text-muted fw-bold text-uppercase"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${d.d || "-"}, ${d.n}</div>
                    ${(d.c && d.c.includes(',')) ? `<span class="badge bg-light text-muted border mt-1 font-monospace" style="font-size:0.68rem;"><i class="bi bi-satellite me-1"></i>${d.c}</span>` : ""}
                </td>
                <td>
                    <div class="fw-bold text-dark text-uppercase">${d.tn}</div>
                    <div class="small text-secondary text-uppercase">${d.vr || "Varieti Umum"}</div>
                    <div><span class="tag-crop-cat"><i class="bi bi-tag-fill me-1" style="color: var(--primary);"></i>${d.kt || "UMUM"}</span> ${(d.um && d.um !== "-") ? `<span class="tag-crop-cat ms-1">${d.um}</span>` : ""}</div>
                </td>
                <td>
                    <div class="fw-bold text-dark">
                        <span class="${lsVal > 0 ? 'text-danger' : 'text-success'}">${lsVal.toFixed(2)}</span> / <span class="text-secondary">${ltVal.toFixed(2)} Ha</span>
                    </div>
                    <div class="small text-muted fw-bold" style="font-size: 0.75rem;">(${pct}% terjejas)</div>
                    <div class="mini-progress-bg"><div class="mini-progress-fill ${barColor}" style="width: ${pct}%"></div></div>
                </td>
                <td style="max-width: 240px;">
                    <div class="d-flex flex-wrap">${pestBadges}</div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle flex-shrink-0 shadow-sm">${initials}</div>
                        <div class="text-truncate" style="max-width: 140px;">
                            <div class="fw-bold text-dark text-uppercase small text-truncate" title="${d.pg}">${d.pg}</div>
                            <div class="small text-muted text-truncate fst-italic" style="font-size: 0.72rem;">${d.em || "-"}</div>
                        </div>
                    </div>
                </td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-outline-primary rounded-3 shadow-sm me-1" title="Lihat Butiran" onclick="event.stopPropagation(); DataManager.viewRec(${realOrigIndex > -1 ? realOrigIndex : (st+i)})"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn btn-sm btn-danger rounded-3 shadow-sm" title="Jana PDF Laporan" 
                        data-lokasi="${d.l}" data-pegawai="${d.pg}" data-coord="${d.c}" data-tarikh="${d.t}" 
                        onclick="event.stopPropagation(); ExportManager.klikJanaPDF(this)">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                    </button>
                </td>
            </tr>`; 
        }).join('') : '<tr><td colspan="7" class="text-center text-muted p-5"><i class="bi bi-folder-x fs-2 d-block text-secondary mb-2"></i>Tiada rekod padanan ditemui.</td></tr>'; 
        
        const infoEl = document.getElementById('pgInfo');
        if (infoEl) infoEl.innerText = `Memaparkan Halaman ${AppState.pg} daripada ${totalPgs}`;
        
        const recCountEl = document.getElementById('tableRecordCount');
        if (recCountEl) {
            let startNum = totalRecs === 0 ? 0 : st + 1;
            let endNum = Math.min(st + AppState.pSize, totalRecs);
            recCountEl.innerHTML = `<i class="bi bi-funnel-fill me-1" style="color: var(--primary);"></i> Memaparkan <b>${startNum} - ${endNum}</b> daripada <b>${totalRecs.toLocaleString('en-US')}</b> rekod (Jumlah asal: ${AppState.fData.length.toLocaleString('en-US')})`;
        }
        
        const prevBtn = document.getElementById('btnPrevPg');
        const nextBtn = document.getElementById('btnNextPg');
        if (prevBtn) prevBtn.disabled = (AppState.pg <= 1);
        if (nextBtn) nextBtn.disabled = (AppState.pg >= totalPgs);
    },
    
    movePg: function(v) { 
        AppState.pg = Math.max(1, AppState.pg+v); 
        this.renTab(); 
    },

    // ============================================================
    // FUNGSI UTAMA: PENGURUSAN ISIHAN LAJUR JADUAL (DYNAMIC SORT)
    // ============================================================
    sortData: function(property) {
        if (this.currentSortCol === property) {
            this.currentSortDir = this.currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortCol = property;
            this.currentSortDir = 'asc';
        }
        
        this.reExecuteSort();
    },

    reExecuteSort: function() {
        const col = this.currentSortCol;
        const dir = this.currentSortDir;

        AppState.fData.sort((a, b) => {
            let valA = a[col];
            let valB = b[col];

            if (col === 'lt' || col === 'ls') {
                return dir === 'asc' ? (parseFloat(valA) - parseFloat(valB)) : (parseFloat(valB) - parseFloat(valA));
            }

            valA = valA ? String(valA).toLowerCase() : '';
            valB = valB ? String(valB).toLowerCase() : '';

            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        AppState.pg = 1; 
        this.renTab();
        this.updateSortIcons();
    },

    updateSortIcons: function() {
        const listCols = ['t', 'n', 'l', 'tn', 'lt', 'ls'];
        listCols.forEach(c => {
            const iconEl = document.getElementById('sort_' + c);
            if (!iconEl) return;

            if (this.currentSortCol === c) {
                iconEl.className = this.currentSortDir === 'asc' ? 'bi bi-sort-down fw-bold' : 'bi bi-sort-up fw-bold';
                iconEl.style.color = 'var(--primary)';
            } else {
                iconEl.className = 'bi bi-arrow-down-up small text-muted';
                iconEl.style.color = '';
            }
        });
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
