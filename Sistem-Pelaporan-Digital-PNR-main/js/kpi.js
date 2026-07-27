// ==========================================
// FAIL: js/kpi.js (ENTERPRISE GRADE + FILTER TARIKH + ADMIN SUMMARY)
// ==========================================

const KPIManager = {
    targetData: null,
    targetCrops: null,
    allUniqueCrops: [],
    trendChart: null,
    stateChart: null,
    currentDrillDownState: null,

   getEffectiveState: function(d) {
        let negeri = (d.n || "").toUpperCase().trim();
        const daerah = (d.d || "").toUpperCase().trim();
        
        // 1. Asingkan Cameron Highlands dari Pahang
        if (negeri === "PAHANG" && (daerah === "CAMERON HIGHLANDS" || daerah === "C. HIGHLANDS")) {
            return "CAMERON HIGHLANDS";
        }
        
        // 2. PENYELAMAT EJAAN: Tangkap semua variasi Wilayah Persekutuan
        if (negeri.includes("LABUAN")) return "W.P. LABUAN";
        if (negeri.includes("KUALA LUMPUR") || negeri === "KL") return "W.P. KUALA LUMPUR";
        if (negeri.includes("PUTRAJAYA")) return "W.P. PUTRAJAYA";
        
        // 3. Langkah keselamatan untuk singkatan negeri lain
        if (negeri === "N.SEMBILAN" || negeri === "N. SEMBILAN") return "NEGERI SEMBILAN";
        if (negeri === "P.PINANG" || negeri === "P. PINANG" || negeri === "PENANG") return "PULAU PINANG";

        return negeri;
    },

    init: async function() {
        Swal.fire({ title: 'Memuatkan Data SKU...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const r = await API.postData('getKPIData', {}); 
            Swal.close();
            if(r.success) {
                this.targetData = r.dataSasaran;
                this.targetCrops = r.dataSenarai;
                this.extractUniqueCrops();
                
                const d = new Date();
                const elDate = document.getElementById('lastUpdatedText');
                if(elDate) elDate.innerHTML = `<i class="bi bi-circle-fill text-success live-indicator"></i> Dikemas kini pada: Hari ini, ${d.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'})}`;

                this.renderDashboard();
            } else { alert("Gagal ambil data sasaran: " + r.message); }
        } catch(e) { Swal.close(); console.error(e); }
    },

    extractUniqueCrops: function() {
        let crops = new Set();
        Object.values(this.targetCrops).forEach(arr => arr.forEach(t => crops.add(t)));
        this.allUniqueCrops = Array.from(crops).sort();
    },

    // --- FUNGSI UTAMA: RENDER DASHBOARD (DENGAN FILTER TARIKH) ---
    renderDashboard: function() {
        const currentNegeri = FilterManager.v('selNegeri'); 
        
        const startDate = document.getElementById('dS') ? document.getElementById('dS').value : '';
        const endDate = document.getElementById('dE') ? document.getElementById('dE').value : '';
        
        let filteredData = AppState.mData;
        if (startDate && endDate) {
            const s = new Date(startDate).setHours(0,0,0,0);
            const e = new Date(endDate).setHours(23,59,59,999);
            filteredData = AppState.mData.filter(d => {
                const dt = new Date(d.t).getTime();
                return dt >= s && dt <= e;
            });
        }

        this.renderKPICards(currentNegeri, filteredData);
        this.renderStateChart(currentNegeri, filteredData);
        this.renderStateLeaderboard(currentNegeri, filteredData);
        this.renderTrendChart(currentNegeri, filteredData); 
        this.renderMatrixGrid(currentNegeri, filteredData);
        this.renderExtraCrops(currentNegeri, filteredData);
        this.renderAdminSummaryTable(currentNegeri, filteredData);
        this.renderPrintSummaryTable(currentNegeri, filteredData);
    },

    // 1. KAD KPI MODEN & OVERALL PROGRESS (DESIGN CANTIK)
    renderKPICards: function(filterNegeri, fData) {
        const container = document.getElementById('kpiCardsModern');
        if(!container) return; container.innerHTML = '';
        
        const categories = [
            { id: "BUAH-BUAHAN", label: "Buah-buahan", icon: "bi-apple", color: "success" },
            { id: "SAYUR-SAYURAN", label: "Sayur-sayuran", icon: "bi-flower3", color: "primary" }, 
            { id: "KONTAN", label: "Kontan & lain-lain", icon: "bi-cash-stack", color: "warning" },
            { id: "KELAPA", label: "Kelapa", icon: "bi-tree-fill", color: "info" }
        ];

        let globalTarget = 0, globalActual = 0;

        categories.forEach(cat => {
            let totalSasaran = 0, totalActual = 0;
            
            Object.keys(this.targetData).forEach(negKey => {
                if(filterNegeri.length === 0 || filterNegeri.includes(negKey)) {
                    totalSasaran += (this.targetData[negKey][cat.id === "KONTAN" ? "KONTAN" : cat.id] || 0);
                }
            });

            fData.forEach(d => {
                const effNegeri = this.getEffectiveState(d);
                if(filterNegeri.length === 0 || filterNegeri.includes(effNegeri)) {
                    let dbK = (d.kt || "").toUpperCase(), dbT = (d.tn || "").toUpperCase(), isMatch = false;
                    if (cat.id === "BUAH-BUAHAN" && dbK.includes("BUAH")) isMatch = true;
                    else if (cat.id === "SAYUR-SAYURAN" && dbK.includes("SAYUR")) isMatch = true;
                    else if (cat.id === "KONTAN" && (dbK.includes("KONTAN") || dbK.includes("SINGKAT") || dbK.includes("LAIN"))) isMatch = true;
                    else if (cat.id === "KELAPA" && (dbK.includes("KELAPA") || dbT.includes("KELAPA"))) isMatch = true;
                    if (isMatch) totalActual += (parseFloat(d.lt) || 0);
                }
            });

            globalTarget += totalSasaran; globalActual += totalActual;
            const peratus = totalSasaran > 0 ? Math.min(100, (totalActual / totalSasaran) * 100).toFixed(1) : 0;
            
            // KEKALKAN DESIGN KAD BAYANG & BORDER KIRI
            container.innerHTML += `
                <div class="col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100" style="border-radius: 12px; border-left: 5px solid var(--bs-${cat.color}) !important;">
                        <div class="card-body p-3 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-auto">
                                <h6 class="fw-bold text-muted small m-0">${cat.label}</h6>
                                <i class="bi ${cat.icon} text-${cat.color} fs-5" style="line-height: 1;"></i>
                            </div>
                            <div class="mt-3">
                                <div class="fs-4 fw-bold text-dark mb-1">${totalActual.toLocaleString(undefined,{maximumFractionDigits:1})} <small class="text-muted" style="font-size:0.7rem">Ha</small></div>
                                <div class="d-flex justify-content-between small">
                                    <span class="text-muted">Prestasi</span>
                                    <span class="fw-bold text-${cat.color}">${peratus}%</span>
                                </div>
                                <div class="progress mt-2" style="height: 5px; border-radius: 10px;">
                                    <div class="progress-bar bg-${cat.color}" style="width: ${peratus}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        });

        const overallPeratus = globalTarget > 0 ? Math.min(100, (globalActual / globalTarget) * 100).toFixed(1) : 0;
        const bar = document.getElementById('overallProgressBar');
        const txt = document.getElementById('overallProgressText');
        if(bar) bar.style.width = overallPeratus + '%';
        if(txt) txt.innerText = `${overallPeratus}% (${globalActual.toLocaleString(undefined,{maximumFractionDigits:1})} / ${globalTarget.toLocaleString()} Ha)`;
    },

    // 2. GRAF PERBANDINGAN NEGERI (DENGAN LABEL MULTILINE & TOOLTIP DETAIL)
    renderStateChart: function(filterNegeri, fData) {
        const ctx = document.getElementById('stateAchievementChart');
        if(!ctx) return;
        if(this.stateChart) this.stateChart.destroy();
        
        let labels = [], data = [], colors = [], targets = [];
        const stateList = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops).sort();
        const modernPalette = ['#0d6efd', '#20c997', '#fd7e14', '#6f42c1', '#e83e8c', '#198754', '#0dcaf0', '#f1c40f', '#dc3545', '#6610f2', '#e67e22', '#16a085', '#2980b9', '#8e44ad'];

        if (this.currentDrillDownState) {
            document.getElementById('stateChartTitle').innerHTML = `<i class="bi bi-pie-chart-fill me-2 text-primary"></i> Pecahan Kategori: ${this.currentDrillDownState}`;
            document.getElementById('btnBackState').style.display = 'block';
            const cats = ["BUAH-BUAHAN", "SAYUR-SAYURAN", "KONTAN", "KELAPA"];
            colors = ['#198754', '#0d6efd', '#ffc107', '#0dcaf0']; 
            
            cats.forEach(cId => {
                let sasaran = 0; if(this.targetData[this.currentDrillDownState]) sasaran = this.targetData[this.currentDrillDownState][cId] || 0;
                let area = 0;
                fData.forEach(d => {
                    if(this.getEffectiveState(d) === this.currentDrillDownState) {
                        let dbK = (d.kt || "").toUpperCase();
                        if((cId==="BUAH-BUAHAN" && dbK.includes("BUAH")) || (cId==="SAYUR-SAYURAN" && dbK.includes("SAYUR")) || (cId==="KONTAN" && (dbK.includes("KONTAN")||dbK.includes("LAIN"))) || (cId==="KELAPA" && (dbK.includes("KELAPA")||(d.tn||"").toUpperCase().includes("KELAPA")))) area += parseFloat(d.lt)||0;
                    }
                });
                
                let pct = sasaran > 0 ? ((area / sasaran) * 100).toFixed(1) : 0;
                let shortCat = cId === "BUAH-BUAHAN" ? "Buah" : cId === "SAYUR-SAYURAN" ? "Sayur" : cId === "KONTAN" ? "Kontan" : "Kelapa";
                labels.push([shortCat, `${pct}%`]); 
                data.push(area.toFixed(2));
                targets.push(sasaran);
            });
        } else {
            document.getElementById('stateChartTitle').innerHTML = `<i class="bi bi-bar-chart-fill me-2"></i> Perbandingan Prestasi Mengikut Negeri (Ha & %)`;
            document.getElementById('btnBackState').style.display = 'none';
            
            stateList.forEach((neg, index) => {
                let shortNeg = neg.replace("W.P. ", "").replace("CAMERON HIGHLANDS", "C. HIGHLANDS");
                let sasaran = 0;
                if(this.targetData[neg]) sasaran += (this.targetData[neg]["BUAH-BUAHAN"]||0) + (this.targetData[neg]["SAYUR-SAYURAN"]||0) + (this.targetData[neg]["KONTAN"]||0) + (this.targetData[neg]["KELAPA"]||0);
                
                let total = 0;
                fData.forEach(d => { if(this.getEffectiveState(d) === neg) total += (parseFloat(d.lt) || 0); });
                
                let pct = sasaran > 0 ? ((total / sasaran) * 100).toFixed(1) : 0;
                labels.push([shortNeg, `${pct}%`]); 
                data.push(total.toFixed(2));
                targets.push(sasaran);
                colors.push(modernPalette[index % modernPalette.length]);
            });
        }
        
        this.stateChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ data: data, targetsArr: targets, backgroundColor: colors, borderRadius: 5 }] },
            options: { 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: { // KEKALKAN TOOLTIP MANTAP
                        callbacks: {
                            title: function(context) { return context[0].label.replace(',', ' '); },
                            label: function(context) {
                                let actual = context.raw;
                                let target = context.dataset.targetsArr[context.dataIndex];
                                let pct = target > 0 ? ((actual / target) * 100).toFixed(1) : 0;
                                return [`Sasaran: ${target.toLocaleString()} Ha`, `Dicapai: ${Number(actual).toLocaleString()} Ha`, `Prestasi: ${pct}%`];
                            }
                        }
                    }
                }, 
                onClick: (e, elements) => { 
                    if (elements.length > 0 && !this.currentDrillDownState) { 
                        const idx = elements[0].index; 
                        this.currentDrillDownState = stateList[idx]; 
                        this.renderStateChart(filterNegeri, fData); 
                    } 
                } 
            }
        });
    },

    backToAllStates: function() { this.currentDrillDownState = null; this.renderDashboard(); },

    // 3. PAPAN PENDAHULU (LEADERBOARD) - DESIGN CANTIK & HOVER
    renderStateLeaderboard: function(filterNegeri, fData) {
        const container = document.getElementById('stateProgressContainer');
        if(!container) return; container.innerHTML = '';
        
        let stateList = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops);
        if(stateList.length === 0) return;

        let arr = [];
        stateList.forEach(neg => {
            let sasaran = 0;
            if(this.targetData[neg]) sasaran += (this.targetData[neg]["BUAH-BUAHAN"]||0) + (this.targetData[neg]["SAYUR-SAYURAN"]||0) + (this.targetData[neg]["KONTAN"]||0) + (this.targetData[neg]["KELAPA"]||0);
            let actual = 0;
            fData.forEach(d => { if(this.getEffectiveState(d) === neg) actual += (parseFloat(d.lt) || 0); });
            arr.push({ state: neg, pct: sasaran > 0 ? (actual / sasaran) * 100 : 0, actual: actual, target: sasaran });
        });

        arr.sort((a, b) => b.pct - a.pct);

        let html = '';
        arr.forEach((item, index) => {
            let shortNeg = item.state.replace("NEGERI SEMBILAN", "N. SEMBILAN").replace("W.P. ", "").replace("CAMERON HIGHLANDS", "C. HIGHLANDS");
            let color = item.pct >= 100 ? 'success' : (item.pct >= 50 ? 'primary' : 'danger');
            let medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''));
            
            html += `
            <div class="col">
                <div class="bg-white p-2 rounded border shadow-sm h-100 d-flex flex-column justify-content-center" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div class="d-flex justify-content-between small fw-bold mb-1">
                        <span class="text-dark text-truncate pe-2" title="${item.state}">${medal} ${shortNeg}</span>
                        <span class="text-${color}">${item.pct.toFixed(1)}%</span>
                    </div>
                    <div class="progress" style="height: 6px; border-radius: 10px;">
                        <div class="progress-bar bg-${color}" style="width: ${Math.min(100, item.pct)}%"></div>
                    </div>
                    <div class="text-muted mt-1 d-flex justify-content-between" style="font-size: 0.65rem;">
                        <span>Capai: ${item.actual.toLocaleString(undefined,{maximumFractionDigits:1})}</span>
                        <span>Sasaran: ${item.target.toLocaleString()}</span>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    // 4. GRAF TREND BULANAN SEBENAR
    renderTrendChart: function(filterNegeri, fData) {
        const ctx = document.getElementById('skuTrendChart');
        if(!ctx) return;
        if(this.trendChart) this.trendChart.destroy();
        const bulanLabelsAll = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
        const currentMonthIdx = new Date().getMonth(); 
        let monthlyData = new Array(12).fill(0);
        fData.forEach(d => {
            const effNegeri = this.getEffectiveState(d);
            if(filterNegeri.length === 0 || filterNegeri.includes(effNegeri)) {
                const date = new Date(d.t);
                if(!isNaN(date)) monthlyData[date.getMonth()] += (parseFloat(d.lt) || 0);
            }
        });
        const slicedLabels = bulanLabelsAll.slice(0, currentMonthIdx + 1);
        const slicedData = monthlyData.slice(0, currentMonthIdx + 1);
        this.trendChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: slicedLabels, datasets: [{ label: 'Luas Bulanan (Ha)', data: slicedData, backgroundColor: 'rgba(13, 110, 253, 0.7)', borderColor: '#0d6efd', borderWidth: 1, borderRadius: 4 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    },

    // 5. PENAPIS KANBAN PANTAS
    filterKanban: function(type, btn) {
        if(btn) {
            let btns = btn.parentElement.querySelectorAll('.btn');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        let doneItems = document.querySelectorAll('.kanban-item-done');
        let pendingItems = document.querySelectorAll('.kanban-item-pending');
        
        if(type === 'all') {
            doneItems.forEach(el => el.style.display = 'flex');
            pendingItems.forEach(el => el.style.display = 'flex');
        } else if(type === 'done') {
            doneItems.forEach(el => el.style.display = 'flex');
            pendingItems.forEach(el => el.style.display = 'none');
        } else if(type === 'pending') {
            doneItems.forEach(el => el.style.display = 'none');
            pendingItems.forEach(el => el.style.display = 'flex');
        }
    },

    // 6. MATRIK TUGASAN KANBAN (KEKALKAN HOVER, KLIK POP-UP, DAN BORDER DASHED)
    renderMatrixGrid: function(filterNegeri, fData) {
        const container = document.getElementById('kanbanMatrixContainer');
        if(!container) return;
        container.innerHTML = '';
        
        let states = (AppState.uProf.state !== "ALL") ? [(AppState.uProf.state === "PAHANG" && AppState.uProf.daerah === "CAMERON HIGHLANDS") ? "CAMERON HIGHLANDS" : AppState.uProf.state] : (filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops).sort());
        
        let html = '';
        states.forEach(neg => {
            const targetList = this.targetCrops[neg] || [];
            if(targetList.length === 0) return; 

            let sasaranKanban = 0;
            if(this.targetData[neg]) sasaranKanban += (this.targetData[neg]["BUAH-BUAHAN"]||0) + (this.targetData[neg]["SAYUR-SAYURAN"]||0) + (this.targetData[neg]["KONTAN"]||0) + (this.targetData[neg]["KELAPA"]||0);
            
            let actualKanban = 0;
            fData.forEach(d => { if(this.getEffectiveState(d) === neg) actualKanban += (parseFloat(d.lt) || 0); });
            let pctKanban = sasaranKanban > 0 ? ((actualKanban / sasaranKanban) * 100).toFixed(1) : 0;
            
            let colorClass = pctKanban >= 100 ? 'text-success' : (pctKanban >= 50 ? 'text-primary' : 'text-danger');
            let shortNeg = neg.replace("NEGERI SEMBILAN", "N. SEMBILAN").replace("W.P. ", "").replace("CAMERON HIGHLANDS", "C. HIGHLANDS");
            
            let stateHTML = `
            <div class="d-flex flex-column gap-2 kanban-column" style="min-width: 140px; max-width: 160px; flex: 0 0 auto;">
                <div class="fw-bold text-center border-bottom border-2 border-dark pb-2 mb-2 text-dark text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.5px;">
                    ${shortNeg} <br>
                    <span class="${colorClass} fs-6">${pctKanban}%</span>
                </div>
            `;

            let siap = [], belum = [];
            [...targetList].sort().forEach(crop => {
                const stats = this.getCropStats(neg, crop, fData);
                if(stats.count > 0) siap.push({ name: crop, count: stats.count, area: stats.area });
                else belum.push(crop);
            });
            
            siap.forEach(item => {
                stateHTML += `<div class="kanban-item-done p-2 border border-success bg-success bg-opacity-10 rounded shadow-sm d-flex justify-content-between align-items-center" onclick="KPIManager.showDetails('${neg}', '${item.name}', ${item.count}, ${item.area})" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Klik untuk maklumat"><span class="fw-bold text-success text-truncate me-1" style="font-size: 0.7rem;" title="${item.name}">${item.name}</span><span style="font-size: 0.85rem;">✅</span></div>`;
            });

            belum.forEach(crop => {
                stateHTML += `<div class="kanban-item-pending p-2 border rounded d-flex justify-content-between align-items-center bg-white" style="border-style: dashed !important; border-color: #adb5bd !important;"><span class="fw-bold text-muted text-truncate me-1" style="font-size: 0.7rem;" title="${crop}">${crop}</span><span class="text-danger" style="font-size: 0.85rem;">⭕</span></div>`;
            });

            stateHTML += `</div>`; 
            html += stateHTML;
        });
        container.innerHTML = html || '<div class="w-100 text-center text-muted fst-italic py-4">Tiada sasaran ditetapkan.</div>';
    },

    getCropStats: function(negeri, cropName, fData) {
        let count = 0, area = 0;
        fData.forEach(d => { if(this.getEffectiveState(d) === negeri && (d.tn || "").toUpperCase().trim() === cropName) { count++; area += (parseFloat(d.lt) || 0); } });
        return { count: count, area: area };
    },

    showDetails: function(negeri, crop, bilLokasi, luas) {
        Swal.fire({ title: `<small class="text-muted">${negeri}</small><br>${crop}`, html: `<div class="row mt-3"><div class="col-6 border-end"><h3 class="fw-bold">${bilLokasi}</h3><small class="text-muted">LOKASI</small></div><div class="col-6"><h3 class="fw-bold text-primary">${luas.toFixed(1)}</h3><small class="text-muted">HEKTAR</small></div></div>`, confirmButtonText: 'Tutup' });
    },

    // 7. TANAMAN EXTRA (KEKALKAN BADGE CANTIK & SHADOW CARD)
    renderExtraCrops: function(filterNegeri, fData) {
        const container = document.getElementById('extraCropsContainer');
        if(!container) return; container.innerHTML = '';
        const states = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops).sort();
        let hasData = false;
        
        states.forEach(neg => {
            const sasaran = this.targetCrops[neg] || [];
            let extraObj = {}; 
            
            fData.forEach(d => { 
                if(this.getEffectiveState(d) === neg) { 
                    let t = (d.tn || "").toUpperCase().trim(); 
                    if(!sasaran.includes(t) && t !== "") {
                        if(!extraObj[t]) extraObj[t] = 0;
                        extraObj[t] += (parseFloat(d.lt) || 0); 
                    }
                } 
            });

            const extraKeys = Object.keys(extraObj).sort();
            if(extraKeys.length > 0) {
                hasData = true;
                const col = document.createElement('div'); col.className = 'col';
                let badgesHTML = extraKeys.map(c => `<span class="badge bg-info bg-opacity-10 text-dark border border-info-subtle shadow-sm" style="font-size:0.65rem">${c} <span class="text-primary ms-1">${extraObj[c].toFixed(1)} Ha</span></span>`).join('');
                
                col.innerHTML = `<div class="card h-100 border shadow-sm" style="border-radius: 10px;"><div class="card-header bg-white py-2 fw-bold text-primary small border-0">${neg}</div><div class="card-body pt-0 pb-3"><div class="d-flex flex-wrap gap-1">${badgesHTML}</div></div></div>`;
                container.appendChild(col);
            }
        });
        if(!hasData) container.innerHTML = '<div class="col-12 text-center text-muted fst-italic py-3">Tiada tanaman luar sasaran dikesan.</div>';
    },

    // 8. JADUAL RUMUSAN ADMIN (PDF SAHAJA - KEKAL)
    renderAdminSummaryTable: function(filterNegeri, fData) {
        const section = document.getElementById('adminSummarySection');
        const container = document.getElementById('adminSummaryTableContainer');
        if(!section || !container) return;

        if (AppState.uProf && AppState.uProf.role !== 'ADMIN') {
            section.classList.add('d-none');
            section.classList.remove('d-print-block');
            return;
        }

        let states = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetData).sort();
        const cats = [
            { id: "BUAH-BUAHAN", label: "BUAH" },
            { id: "SAYUR-SAYURAN", label: "SAYUR" },
            { id: "KONTAN", label: "KONTAN" },
            { id: "KELAPA", label: "KELAPA" }
        ];

        let html = `<table class="table table-sm table-bordered" style="font-size: 0.75rem; width:100%;"><thead class="table-dark text-center"><tr><th rowspan="2" class="align-middle">NEGERI</th><th colspan="3">BUAH-BUAHAN</th><th colspan="3">SAYUR-SAYURAN</th><th colspan="3">KONTAN/LAIN</th><th colspan="3">KELAPA</th></tr><tr style="font-size: 0.65rem;"><th>Sasaran 2026</th><th>Pencapaian semasa</th><th>%</th><th>Sasaran 2026</th><th>Pencapaian semasa</th><th>%</th><th>Sasaran 2026</th><th>Pencapaian semasa</th><th>%</th><th>Sasaran 2026S</th><th>Pencapaian semasa</th><th>%</th></tr></thead><tbody>`;

        states.forEach(neg => {
            html += `<tr><td class="fw-bold">${neg}</td>`;
            cats.forEach(c => {
                let sasaran = this.targetData[neg] ? (this.targetData[neg][c.id] || 0) : 0;
                let actual = 0;
                fData.forEach(d => {
                    if(this.getEffectiveState(d) === neg) {
                        let dbK = (d.kt || "").toUpperCase(), dbT = (d.tn || "").toUpperCase(), isM = false;
                        if (c.id === "BUAH-BUAHAN" && dbK.includes("BUAH")) isM = true;
                        else if (c.id === "SAYUR-SAYURAN" && dbK.includes("SAYUR")) isM = true;
                        else if (c.id === "KONTAN" && (dbK.includes("KONTAN") || dbK.includes("SINGKAT") || dbK.includes("LAIN"))) isM = true;
                        else if (c.id === "KELAPA" && (dbK.includes("KELAPA") || dbK.includes("INDUSTRI") || dbT.includes("KELAPA"))) isM = true;
                        if (isM) actual += (parseFloat(d.lt) || 0);
                    }
                });
                let pct = sasaran > 0 ? ((actual / sasaran) * 100).toFixed(1) : "0.0";
                html += `<td class="text-center">${sasaran}</td><td class="text-center text-primary">${actual.toFixed(1)}</td><td class="text-center fw-bold">${pct}%</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    // 9. JADUAL RINGKASAN DATA DETAIL (PDF KEKAL KEMAS)
    renderPrintSummaryTable: function(filterNegeri, fData) {
        const tbody = document.querySelector('#printSummaryTable tbody');
        if(!tbody) return;
        
        let sum = {};
        const catMap = { "BUAH": "BUAH-BUAHAN", "SAYUR": "SAYUR-SAYURAN", "KONTAN": "KONTAN & LAIN-LAIN", "SINGKAT": "KONTAN & LAIN-LAIN", "LAIN": "KONTAN & LAIN-LAIN", "KELAPA": "KELAPA", "INDUSTRI": "KELAPA" };

        fData.forEach(d => {
            const effNegeri = this.getEffectiveState(d);
            if(filterNegeri.length === 0 || filterNegeri.includes(effNegeri)) {
                let rawK = (d.kt || "").toUpperCase().trim(), tan = (d.tn || "TIADA").toUpperCase().trim(), k = "KONTAN & LAIN-LAIN"; 
                for (let key in catMap) { if(rawK.includes(key)) { k = catMap[key]; break; } }
                if(tan.includes("KELAPA")) k = "KELAPA";
                let key = k + "_" + tan;
                if(!sum[key]) sum[key] = { k: k, t: tan, c: 0, l: 0 };
                sum[key].c++; sum[key].l += (parseFloat(d.lt) || 0);
            }
        });

        const sortedItems = Object.values(sum).sort((a, b) => a.k.localeCompare(b.k) || a.t.localeCompare(b.t));
        if (sortedItems.length === 0) { tbody.innerHTML = '<tr><td colspan="3" class="text-center p-3">Tiada data untuk tapisan tarikh ini</td></tr>'; return; }

        let html = '', currentCat = '', subL = 0, subA = 0;
        sortedItems.forEach((item, i) => {
            if (item.k !== currentCat) {
                if (currentCat !== '') html += `<tr class="fw-bold" style="background-color: #f8fafc !important;"><td class="text-end small">JUMLAH ${currentCat}</td><td class="text-center">${subL}</td><td class="text-center">${subA.toFixed(2)}</td></tr>`;
                subL = 0; subA = 0; currentCat = item.k;
                html += `<tr style="background-color: #f1f5f9 !important;"><td colspan="3" class="fw-bold text-primary py-2 px-3"><i class="bi bi-tag-fill me-1"></i> ${currentCat}</td></tr>`;
            }
            html += `<tr><td class="ps-4">${item.t}</td><td class="text-center">${item.c}</td><td class="text-center">${item.l.toFixed(2)}</td></tr>`;
            subL += item.c; subA += item.l;
            if (i === sortedItems.length - 1) html += `<tr class="fw-bold" style="background-color: #f8fafc !important;"><td class="text-end small">JUMLAH ${currentCat}</td><td class="text-center">${subL}</td><td class="text-center">${subA.toFixed(2)}</td></tr>`;
        });
        tbody.innerHTML = html;
    },

    printPDF: function() { 
        const d = new Date();
        const elDate = document.getElementById('printDate');
        const elUser = document.getElementById('printUser');
        if(elDate) elDate.innerText = d.toLocaleDateString('ms-MY', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
        if(elUser) elUser.innerText = (AppState.uProf && AppState.uProf.name) ? AppState.uProf.name : 'Pegawai PNR';
        window.print(); 
    }
};
