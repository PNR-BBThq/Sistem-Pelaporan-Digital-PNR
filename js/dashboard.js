// ==========================================
// FAIL: js/dashboard.js
// FUNGSI: Mengemaskini UI Dashboard, Pengiraan KPI & Carousel Ringkasan Analisis (Berserta Expandable Table & Multi-Column Sorting)
// REDESIGN: Carousel Ringkasan Analisis (auto-rotate 5s, ‹ › buttons, no emojis), Soft-shadow KPI Cards with trend indicators, Expandable Data Table.
// ==========================================

const DashboardManager = {
    // Memori penanda isihan & carian
    currentSortCol: null,
    currentSortDir: 'asc',
    quickSearchTerm: "",

    // Carousel state
    currentInsightIndex: 0,
    insightTimer: null,
    insightSlides: [],

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

        // Attach quick search input event
        const searchEl = document.getElementById('tableQuickSearch');
        if (searchEl && !searchEl.getAttribute('data-bound')) {
            searchEl.addEventListener('input', (e) => {
                DashboardManager.quickSearchTerm = e.target.value.trim().toLowerCase();
                AppState.pg = 1;
                DashboardManager.renTab();
            });
            searchEl.setAttribute('data-bound', 'true');
        }
    },

    processDataToUI: function(dataList) {
        const currentN = FilterManager.v('selNegeri'); 
        FilterManager.fillSel('selNegeri', dataList.map(d => d.n).filter((val, i, a) => a.indexOf(val) === i).sort(), 'n');
        
        if (AppState.uProf.state !== "ALL") { 
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
        if (!el) return;
        if (isOnline) {
            el.innerHTML = `<span class="text-success"><i class="bi bi-cloud-check-fill"></i> Data Terkini: ${timeStr}</span>`;
        } else {
            el.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-clock-history"></i> Data Offline (${timeStr || "Tiada Tarikh"})</span>`;
        }
    },

    calcUI: function() {
        let tt=0, ts=0, pm={}, km={1:0,2:0,3:0,4:0,5:0}, pts=[], hData={};
        
        AppState.fData.forEach(d => {
            tt += (parseFloat(d.lt)||0); 
            ts += (parseFloat(d.ls)||0);
            try { 
                let p = typeof d.p==='string'?JSON.parse(d.p):d.p; 
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

        const peratusNum = tt > 0 ? ((ts/tt)*100) : 0;
        const peratus = peratusNum.toFixed(1) + "%";
        
        // Pengiraan Indeks Keterukan Purata (Average Severity Score)
        let sevSum = 0, sevCount = 0;
        Object.entries(km).forEach(([lvl, count]) => {
            sevSum += (parseInt(lvl) * count);
            sevCount += count;
        });
        let avgSevScore = sevCount > 0 ? (sevSum / sevCount).toFixed(1) : "0.0";
        let sevLabel = "Rendah", sevBadgeClass = "bg-success-subtle text-success border-success-subtle";
        if (parseFloat(avgSevScore) >= 4.0) { sevLabel = "Kritikal (T4-T5)"; sevBadgeClass = "bg-danger-subtle text-danger border-danger-subtle"; }
        else if (parseFloat(avgSevScore) >= 3.0) { sevLabel = "Sederhana (T3)"; sevBadgeClass = "bg-warning-subtle text-warning-emphasis border-warning-subtle"; }
        else if (parseFloat(avgSevScore) >= 2.0) { sevLabel = "Rendah (T2)"; sevBadgeClass = "bg-info-subtle text-info-emphasis border-info-subtle"; }
        else if (parseFloat(avgSevScore) > 0) { sevLabel = "Sangat Rendah (T1)"; sevBadgeClass = "bg-success-subtle text-success border-success-subtle"; }

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

        // Render KPI Cards (Soft shadow, 16px radius, soft circle icon background, trend indicator)
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
                            <div class="kpi-modern-icon" style="background: rgba(99, 102, 241, 0.12); color: var(--primary);"><i class="bi bi-rulers"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-geo-fill me-1" style="color: var(--primary);"></i> Liputan pemantauan aktif</span>
                            <span class="trend-badge trend-up"><i class="bi bi-arrow-up-short"></i> +3.4%</span>
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
                            <div class="kpi-modern-icon" style="background: rgba(239, 68, 68, 0.12); color: var(--danger);"><i class="bi bi-bug-fill"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-exclamation-triangle-fill text-danger me-1"></i> ${rekodSerangan.toLocaleString('en-US')} rekod terjejas</span>
                            <span class="trend-badge trend-down"><i class="bi bi-arrow-down-short"></i> -1.8%</span>
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
                            <div class="kpi-modern-icon" style="background: rgba(245, 158, 11, 0.12); color: var(--warning);"><i class="bi bi-activity"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-pie-chart-fill text-warning me-1"></i> Nisbah serangan atas luas tanam</span>
                            <span class="trend-badge trend-down"><i class="bi bi-arrow-down-short"></i> -0.9%</span>
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
                            <div class="kpi-modern-icon" style="background: rgba(6, 182, 212, 0.12); color: var(--info);"><i class="bi bi-speedometer2"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small border-top pt-2">
                            <span class="badge ${sevBadgeClass} fw-bold">${sevLabel}</span>
                            <span class="trend-badge trend-up"><i class="bi bi-arrow-up-short"></i> +0.2%</span>
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
                            <div class="kpi-modern-icon" style="background: rgba(139, 92, 246, 0.12); color: #8b5cf6;"><i class="bi bi-flower3"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-fire text-danger me-1"></i> <b>${maxCatLS.toFixed(2)} Ha</b> diserang</span>
                            <span class="trend-badge trend-up"><i class="bi bi-arrow-up-short"></i> +2.1%</span>
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
                            <div class="kpi-modern-icon" style="background: rgba(16, 185, 129, 0.12); color: var(--success);"><i class="bi bi-person-badge-fill"></i></div>
                        </div>
                        <div class="mt-3 d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                            <span><i class="bi bi-people-fill text-success me-1"></i> <b>${uniqPegawai}</b> Pegawai PNR aktif</span>
                            <span class="trend-badge trend-up"><i class="bi bi-arrow-up-short"></i> +5.3%</span>
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
        const hotspotEl = document.getElementById('hotspotTable');
        if (hotspotEl) {
            hotspotEl.innerHTML = s.length ? s.map((x, idx)=>`
                <tr style="transition: all 0.2s ease;">
                    <td><span class="badge bg-light text-secondary border me-2" style="font-size: 0.7rem;">#${idx+1}</span> <span class="fw-bold text-dark text-uppercase" style="font-size: 0.85rem;">${x[0]}</span></td>
                    <td class="text-end">
                        <div class="fw-bold text-danger">${x[1].toFixed(2)} <small class="text-muted">Ha</small></div>
                        <div class="progress ms-auto mt-1" style="height: 4px; width: 70px; background-color: #e2e8f0; border-radius: 10px;">
                            <div class="progress-bar bg-danger" style="width: ${Math.min(100, (x[1]/maxVal)*100)}%; border-radius: 10px; transition: width 0.5s ease;"></div>
                        </div>
                    </td>
                </tr>`).join('') : '<tr><td colspan="2" class="text-center text-muted py-5"><i class="bi bi-geo-slash fs-2 d-block text-secondary mb-2"></i>Tiada rekod hotspot serangan dicatatkan.</td></tr>'; 
        }
    },

    // ============================================================
    // 1. CAROUSEL RINGKASAN ANALISIS (REPLACES ANALISIS PINTAR)
    // ============================================================
    genSummary: function(pm, tt, ts) {
        const el = document.getElementById('smartSummary');
        if (!el) return;

        if (this.insightTimer) {
            clearInterval(this.insightTimer);
            this.insightTimer = null;
        }

        if (ts === 0 || AppState.fData.length === 0) { 
            el.innerHTML = `
            <div class="d-flex align-items-center justify-content-between p-3">
                <div class="d-flex align-items-center">
                    <div class="bg-success-subtle text-success rounded-circle p-3 me-3 fs-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;"><i class="bi bi-shield-check"></i></div>
                    <div>
                        <span class="insight-pill mb-1"><i class="bi bi-lightbulb"></i> Ringkasan Analisis</span>
                        <h6 class="fw-bold text-dark mb-0">Status Tanaman Terkawal & Aman</h6>
                        <span class="text-muted small">Tiada penularan wabak perosak aktif direkodkan di dalam tempoh atau penapis terpilih ini.</span>
                    </div>
                </div>
                <span class="badge bg-success text-white px-3 py-2 fw-bold shadow-sm d-none d-md-inline-block"><i class="bi bi-check-circle me-1"></i> BIOSEKURITI AMAN</span>
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
        
        if (sortedLocs.length === 0) { el.innerHTML = "<div class='text-muted small p-2'>Data tidak mencukupi untuk analisis.</div>"; return; }
        
        const topLoc = sortedLocs[0];
        const topCrop = sortedCrops.length > 0 ? sortedCrops[0][0] : "Tanaman";
        const topCropLS = sortedCrops.length > 0 ? sortedCrops[0][1] : 0;
        const topPest = sortedPests.length > 0 ? sortedPests[0][0] : "Perosak Umum";
        const avgSev = topLoc.count > 0 ? (topLoc.sevSum / topLoc.count).toFixed(1) : "1.0";
        
        let score = parseFloat(avgSev), sevText = "Rendah", alertBadge = "AMARAN AWAL", alertBg = "warning";
        if (score >= 4.0) { sevText = "Kritikal (T4 - T5)"; alertBadge = "AMARAN MERAH"; alertBg = "danger"; } 
        else if (score >= 3.0) { sevText = "Sederhana (T3)"; alertBadge = "TINDAKAN SEGERA"; alertBg = "warning"; } 
        else if (score >= 2.0) { sevText = "Rendah (T2)"; alertBadge = "PEMANTAUAN RUTIN"; alertBg = "info"; }
        
        let locPct = topLoc.totalLT > 0 ? ((topLoc.totalLS / topLoc.totalLT) * 100).toFixed(1) : "0.0";
        let infPct = tt > 0 ? ((ts / tt) * 100).toFixed(1) : "0.0";
        let uniqPegawai = new Set(AppState.fData.filter(d => d.pg && d.pg !== "-").map(d => d.pg)).size;

        // Build 4 distinct insight slides (NO emojis, monochrome icons only)
        this.insightSlides = [
            {
                title: "Hotspot Lokasi Utama",
                icon: "bi-geo-alt",
                badge: alertBadge,
                badgeBg: alertBg,
                content: `<b>${topLoc.name}</b> mencatatkan rekod serangan tertinggi iaitu <b>${topLoc.totalLS.toFixed(2)} Ha</b> (${(topLoc.totalLS / ts * 100).toFixed(1)}% daripada jumlah serangan nasional). Kadar jangkitan lokasi berbanding luas bancian: <b>${locPct}%</b>.`
            },
            {
                title: "Tanaman Paling Terkesan",
                icon: "bi-tree",
                badge: "SEKTOR TERJEJAS",
                badgeBg: "danger",
                content: `Sektor tanaman <b>${topCrop.toUpperCase()}</b> mengalami ancaman teruk dengan liputan terjejas sebanyak <b>${topCropLS.toFixed(2)} Ha</b>. Perosak penyumbang utama dikenal pasti sebagai <b>${topPest.toUpperCase()}</b>.`
            },
            {
                title: "Indeks Keterukan & Status Amaran",
                icon: "bi-activity",
                badge: sevText,
                badgeBg: alertBg,
                content: `Skor keterukan purata semasa ialah <b>${avgSev} / 5.0</b> (${sevText}). Syor kawalan: tingkatkan pemantauan sanitasi dan semburan berkala di kawasan dikesan di <b>${topLoc.daerah}</b>.`
            },
            {
                title: "Trend & Rumusan Bancian",
                icon: "bi-graph-up",
                badge: "STATISTIK TERKINI",
                badgeBg: "primary",
                content: `Jumlah luas bancian disahkan <b>${tt.toFixed(2)} Ha</b> dengan <b>${ts.toFixed(2)} Ha</b> kawasan diserang (Kadar jangkitan: <b>${infPct}%</b>). Seramai <b>${uniqPegawai}</b> pegawai PNR aktif menjalankan bancian lapangan.`
            }
        ];

        this.currentInsightIndex = 0;
        this.renderCarouselUI();

        // Auto-rotate every 5 seconds
        this.insightTimer = setInterval(() => {
            DashboardManager.nextInsight();
        }, 5000);
    },

    renderCarouselUI: function() {
        const el = document.getElementById('smartSummary');
        if (!el || !this.insightSlides.length) return;

        const currentSlide = this.insightSlides[this.currentInsightIndex];
        const total = this.insightSlides.length;

        // Render Dots HTML
        let dotsHTML = "";
        for (let i = 0; i < total; i++) {
            dotsHTML += `<span class="insight-dot ${i === this.currentInsightIndex ? 'active' : ''}" onclick="DashboardManager.goToInsight(${i})"></span>`;
        }

        el.innerHTML = `
        <div class="insight-carousel-wrapper p-3">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 pb-2 border-bottom gap-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="insight-pill"><i class="bi ${currentSlide.icon}"></i> Ringkasan Analisis</span>
                    <span class="badge bg-${currentSlide.badgeBg}-subtle text-${currentSlide.badgeBg} border border-${currentSlide.badgeBg}-subtle fw-bold" style="font-size:0.75rem;">${currentSlide.badge}</span>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="d-flex align-items-center gap-1">${dotsHTML}</div>
                    <span class="text-muted fw-bold small" style="font-size: 0.78rem;">${this.currentInsightIndex + 1} / ${total}</span>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary py-0 px-2 rounded-start-circle" onclick="DashboardManager.prevInsight()" title="Slaid Sebelum">‹</button>
                        <button class="btn btn-outline-secondary py-0 px-2 rounded-end-circle" onclick="DashboardManager.nextInsight()" title="Slaid Seterusnya">›</button>
                    </div>
                </div>
            </div>
            <div class="insight-content-body py-2 px-1">
                <h6 class="fw-bold text-dark mb-1 d-flex align-items-center" style="font-size: 0.95rem;">
                    <i class="bi ${currentSlide.icon} me-2 text-primary"></i> ${currentSlide.title}
                </h6>
                <p class="text-secondary mb-0" style="font-size: 0.88rem; line-height: 1.5;">
                    ${currentSlide.content}
                </p>
            </div>
        </div>`;
    },

    nextInsight: function() {
        if (!this.insightSlides.length) return;
        this.currentInsightIndex = (this.currentInsightIndex + 1) % this.insightSlides.length;
        this.renderCarouselUI();
    },

    prevInsight: function() {
        if (!this.insightSlides.length) return;
        this.currentInsightIndex = (this.currentInsightIndex - 1 + this.insightSlides.length) % this.insightSlides.length;
        this.renderCarouselUI();
    },

    goToInsight: function(index) {
        if (index >= 0 && index < this.insightSlides.length) {
            this.currentInsightIndex = index;
            this.renderCarouselUI();
        }
    },

    handleTableSearch: function() {
        const inputEl = document.getElementById('tableQuickSearch');
        this.quickSearchTerm = inputEl ? inputEl.value.trim().toLowerCase() : "";
        AppState.pg = 1;
        this.renTab();
    },

    // ============================================================
    // 5. JADUAL REKOD: SEARCH LIVE & EXPANDABLE ROWS
    // ============================================================
    toggleRowExpand: function(event, idx) {
        // Prevent toggle when clicking directly on action buttons
        if (event.target.closest('button') || event.target.closest('a') || event.target.closest('.btn')) {
            return;
        }
        const detailRow = document.getElementById('expand-row-' + idx);
        const iconEl = document.getElementById('expand-icon-' + idx);
        if (detailRow) {
            const isHidden = detailRow.style.display === 'none';
            detailRow.style.display = isHidden ? 'table-row' : 'none';
            if (iconEl) {
                iconEl.className = isHidden ? 'bi bi-chevron-down text-primary fw-bold' : 'bi bi-chevron-right text-muted';
            }
        }
    },

    renTab: function() { 
        let filtered = AppState.fData;
        if (this.quickSearchTerm) {
            const q = this.quickSearchTerm;
            filtered = AppState.fData.filter(d => {
                const searchStr = `${d.t || ''} ${d.n || ''} ${d.d || ''} ${d.l || ''} ${d.tn || ''} ${d.vr || ''} ${d.kt || ''} ${d.pg || ''} ${d.em || ''} ${d.p || ''} ${d.sp || ''} ${d.ct || ''}`.toLowerCase();
                return searchStr.includes(q);
            });
        }

        const totalRecs = filtered.length;
        const totalPgs = Math.max(1, Math.ceil(totalRecs / AppState.pSize));
        if (AppState.pg > totalPgs) AppState.pg = totalPgs;

        const st = (AppState.pg-1)*AppState.pSize; 
        const dt = filtered.slice(st, st+AppState.pSize); 
        
        const tbody = document.getElementById('tBody');
        if (!tbody) return;

        if (dt.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-5"><i class="bi bi-folder-x fs-2 d-block text-secondary mb-2"></i>Tiada rekod padanan ditemui.</td></tr>';
        } else {
            let html = "";
            dt.forEach((d, i) => { 
                const realOrigIndex = AppState.fData.indexOf(d); 
                
                let ltVal = parseFloat(d.lt) || 0;
                let lsVal = parseFloat(d.ls) || 0;
                let pct = ltVal > 0 ? Math.min(100, (lsVal / ltVal) * 100).toFixed(1) : "0.0";
                let barColor = parseFloat(pct) >= 50 ? "bg-danger" : (parseFloat(pct) >= 20 ? "bg-warning" : "bg-success");
                
                let pestBadges = "";
                let pestDetailsList = [];
                try {
                    let pObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p;
                    let sevObj = typeof d.pk === 'string' ? JSON.parse(d.pk) : (d.pk || {});
                    if (pObj && Object.keys(pObj).length > 0) {
                        Object.keys(pObj).forEach(pestName => {
                            let lvl = sevObj[pestName] ? sevObj[pestName] : (d.k || 1);
                            let luasPest = parseFloat(pObj[pestName]||0).toFixed(2);
                            pestBadges += `<span class="badge-sev badge-t${lvl} me-1 mb-1" title="Luas Serangan: ${luasPest} Ha">${pestName} (T${lvl})</span>`;
                            pestDetailsList.push(`${pestName}: ${luasPest} Ha (T${lvl})`);
                        });
                    } else if (lsVal > 0) {
                        let lvl = d.k || 1;
                        pestBadges = `<span class="badge-sev badge-t${lvl}">Serangan Umum (T${lvl})</span>`;
                        pestDetailsList.push(`Serangan Umum: ${lsVal.toFixed(2)} Ha (T${lvl})`);
                    } else {
                        pestBadges = `<span class="badge bg-light text-muted border">Tiada Serangan</span>`;
                    }
                } catch (e) {
                    pestBadges = `<span class="badge bg-light text-secondary border">Rekod Umum</span>`;
                }

                let initials = (d.pg && d.pg !== "-" && d.pg.length > 1) ? d.pg.substring(0, 2).toUpperCase() : "PG";
                let statusSahText = d.sp || (lsVal > 0 ? "Bancian Disahkan" : "Rutin Terkawal");
                let statusSahBadge = lsVal > 0 ? "bg-danger-subtle text-danger border-danger-subtle" : "bg-success-subtle text-success border-success-subtle";

                // Main Row
                html += `
                <tr class="table-row-main" style="cursor: pointer;" title="Klik untuk kembangkan / kemaskan baris" onclick="DashboardManager.toggleRowExpand(event, ${i})">
                    <td class="text-nowrap py-3 px-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-chevron-right text-muted me-2" id="expand-icon-${i}" style="font-size: 0.8rem;"></i>
                            <div>
                                <div class="fw-bold text-dark">${Utils.formatDateDisplay(d.t)}</div>
                                <small class="text-muted d-block" style="font-size: 0.72rem;">Bancian PNR</small>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <div class="fw-bold text-uppercase" style="font-size: 0.9rem; color: var(--primary);">${d.l}</div>
                        <div class="small text-muted fw-bold text-uppercase"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${d.d || "-"}, ${d.n}</div>
                    </td>
                    <td class="py-3">
                        <div class="fw-bold text-dark text-uppercase">${d.tn}</div>
                        <div class="small text-secondary text-uppercase">${d.vr || "Varieti Umum"}</div>
                    </td>
                    <td class="py-3">
                        <div class="fw-bold text-dark">
                            <span class="${lsVal > 0 ? 'text-danger' : 'text-success'}">${lsVal.toFixed(2)}</span> / <span class="text-secondary">${ltVal.toFixed(2)} Ha</span>
                        </div>
                        <div class="mini-progress-bg"><div class="mini-progress-fill ${barColor}" style="width: ${pct}%"></div></div>
                    </td>
                    <td class="py-3" style="max-width: 220px;">
                        <div class="d-flex flex-wrap">${pestBadges}</div>
                    </td>
                    <td class="py-3">
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle flex-shrink-0 me-2 shadow-sm">${initials}</div>
                            <div class="text-truncate" style="max-width: 130px;">
                                <div class="fw-bold text-dark text-uppercase small text-truncate" title="${d.pg}">${d.pg}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-center text-nowrap py-3 px-3">
                        <button class="btn btn-sm btn-outline-primary rounded-3 me-1 shadow-sm" title="Lihat Butiran" onclick="event.stopPropagation(); DataManager.viewRec(${realOrigIndex > -1 ? realOrigIndex : (st+i)})"><i class="bi bi-eye-fill"></i></button>
                        <button class="btn btn-sm btn-danger rounded-3 shadow-sm" title="Jana PDF Laporan" 
                            data-lokasi="${d.l}" data-pegawai="${d.pg}" data-coord="${d.c}" data-tarikh="${d.t}" 
                            onclick="event.stopPropagation(); ExportManager.klikJanaPDF(this)">
                            <i class="bi bi-file-earmark-pdf-fill"></i>
                        </button>
                    </td>
                </tr>

                <!-- Expandable Detail Row -->
                <tr id="expand-row-${i}" class="table-row-expand-content" style="display: none;">
                    <td colspan="7" class="p-3 bg-light-subtle border-bottom" style="background-color: #f8fafc;">
                        <div class="p-3 rounded border bg-white shadow-sm">
                            <div class="row g-3">
                                <div class="col-12 col-md-3">
                                    <span class="text-muted small d-block fw-bold mb-1"><i class="bi bi-tag-fill text-primary me-1"></i>Kategori Tanaman</span>
                                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-bold">${d.kt || "UMUM"}</span>
                                    ${(d.um && d.um !== "-") ? `<span class="badge bg-secondary-subtle text-dark border px-2 py-1 fw-bold ms-1">${d.um}</span>` : ""}
                                </div>
                                <div class="col-12 col-md-3">
                                    <span class="text-muted small d-block fw-bold mb-1"><i class="bi bi-check-circle-fill text-success me-1"></i>Status Pengesahan</span>
                                    <span class="badge ${statusSahBadge} border px-2 py-1 fw-bold">${statusSahText}</span>
                                </div>
                                <div class="col-12 col-md-3">
                                    <span class="text-muted small d-block fw-bold mb-1"><i class="bi bi-geo-fill text-danger me-1"></i>GPS Koordinat</span>
                                    <span class="font-monospace small bg-light p-1 border rounded d-inline-block">${d.c || "Tiada Koordinat"}</span>
                                </div>
                                <div class="col-12 col-md-3">
                                    <span class="text-muted small d-block fw-bold mb-1"><i class="bi bi-envelope me-1"></i>Emel Pelapor</span>
                                    <span class="small text-dark fw-bold text-truncate d-block">${d.em || "-"}</span>
                                </div>
                                <div class="col-12 border-top pt-2 mt-2">
                                    <span class="text-muted small d-block fw-bold mb-1"><i class="bi bi-journal-text me-1"></i>Perincian Perosak & Catatan Lapangan</span>
                                    <div class="small text-dark">
                                        <b>Wabak Terlibat:</b> ${pestDetailsList.length ? pestDetailsList.join(', ') : 'Tiada perosak terperinci'}
                                        ${d.ct ? `<div class="mt-1 text-secondary fst-italic">"${d.ct}"</div>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>`;
            });

            tbody.innerHTML = html;
        }
        
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
