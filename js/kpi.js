// ==========================================
// FAIL: js/kpi.js (VERSI KEMAS: FILTER TARIKH & ADMIN)
// ==========================================

const KPIManager = {
    targetData: null,
    targetCrops: null,
    allUniqueCrops: [],
    trendChart: null,
    stateChart: null,
    currentDrillDownState: null,

    getEffectiveState: function(d) {
        const negeri = (d.n || "").toUpperCase().trim();
        const daerah = (d.d || "").toUpperCase().trim();
        if (negeri === "PAHANG" && (daerah === "CAMERON HIGHLANDS" || daerah === "C. HIGHLANDS")) {
            return "CAMERON HIGHLANDS";
        }
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
                if(elDate) {
                    elDate.innerHTML = `<i class="bi bi-circle-fill text-success live-indicator"></i> Dikemas kini pada: Hari ini, ${d.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'})}`;
                }

                this.renderDashboard();
            } else { 
                alert("Gagal ambil data sasaran: " + r.message); 
            }
        } catch(e) { 
            Swal.close(); 
            console.error(e); 
        }
    },

    extractUniqueCrops: function() {
        let crops = new Set();
        Object.values(this.targetCrops).forEach(arr => arr.forEach(t => crops.add(t)));
        this.allUniqueCrops = Array.from(crops).sort();
    },

    // --- FUNGSI UTAMA: RENDER DASHBOARD (DENGAN FILTER TARIKH) ---
    renderDashboard: function() {
        const currentNegeri = FilterManager.v('selNegeri'); 
        
       // 1. Ambil nilai tarikh dari sidebar (Guna ID asal sistem Tuan: dS dan dE)
        const startDate = document.getElementById('dS') ? document.getElementById('dS').value : '';
        const endDate = document.getElementById('dE') ? document.getElementById('dE').value : '';
        
        // 2. Tapis data AppState.mData berdasarkan tarikh
        let filteredData = AppState.mData;
        
        if (startDate && endDate) {
            const s = new Date(startDate).setHours(0,0,0,0);
            const e = new Date(endDate).setHours(23,59,59,999);
            
            filteredData = AppState.mData.filter(d => {
                const dt = new Date(d.t).getTime();
                return dt >= s && dt <= e;
            });
        }

        // 3. Hantar data yang telah ditapis ke semua carta dan jadual
        this.renderKPICards(currentNegeri, filteredData);
        this.renderStateChart(currentNegeri, filteredData);
        this.renderStateLeaderboard(currentNegeri, filteredData);
        this.renderTrendChart(currentNegeri, filteredData); 
        this.renderMatrixGrid(currentNegeri, filteredData);
        this.renderExtraCrops(currentNegeri, filteredData);
        
        // Render untuk PDF
        this.renderAdminSummaryTable(currentNegeri, filteredData);
        this.renderPrintSummaryTable(currentNegeri, filteredData);
    },

    // 1. KAD KPI
    renderKPICards: function(filterNegeri, fData) {
        const container = document.getElementById('kpiCardsModern');
        if(!container) return; 
        container.innerHTML = '';
        
        const categories = [
            { id: "BUAH-BUAHAN", label: "Buah-buahan", icon: "bi-apple", color: "success" },
            { id: "SAYUR-SAYURAN", label: "Sayur-sayuran", icon: "bi-flower3", color: "primary" },
            { id: "KONTAN", label: "Kontan & lain-lain", icon: "bi-cash-stack", color: "warning" },
            { id: "KELAPA", label: "Kelapa", icon: "bi-tree-fill", color: "info" }
        ];
        
        let globalTarget = 0;
        let globalActual = 0;

        categories.forEach(cat => {
            let totalSasaran = 0;
            let totalActual = 0;
            
            // Kira Sasaran
            Object.keys(this.targetData).forEach(negKey => {
                if(filterNegeri.length === 0 || filterNegeri.includes(negKey)) {
                    totalSasaran += (this.targetData[negKey][cat.id === "KONTAN" ? "KONTAN" : cat.id] || 0);
                }
            });
            
            // Kira Pencapaian (Guna data yang dah ditapis: fData)
            fData.forEach(d => {
                const effNegeri = this.getEffectiveState(d);
                if(filterNegeri.length === 0 || filterNegeri.includes(effNegeri)) {
                    let dbK = (d.kt || "").toUpperCase();
                    let dbT = (d.tn || "").toUpperCase();
                    let isM = false;
                    
                    if (cat.id === "BUAH-BUAHAN" && dbK.includes("BUAH")) isM = true;
                    else if (cat.id === "SAYUR-SAYURAN" && dbK.includes("SAYUR")) isM = true;
                    else if (cat.id === "KONTAN" && (dbK.includes("KONTAN") || dbK.includes("SINGKAT") || dbK.includes("LAIN"))) isM = true;
                    else if (cat.id === "KELAPA" && (dbK.includes("KELAPA") || dbK.includes("INDUSTRI") || dbT.includes("KELAPA"))) isM = true;
                    
                    if (isM) {
                        totalActual += (parseFloat(d.lt) || 0);
                    }
                }
            });
            
            globalTarget += totalSasaran; 
            globalActual += totalActual;
            
            const peratus = totalSasaran > 0 ? Math.min(100, (totalActual / totalSasaran) * 100).toFixed(1) : 0;
            
            container.innerHTML += `
                <div class="col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100" style="border-radius:12px; border-left:5px solid var(--bs-${cat.color})!important;">
                        <div class="card-body p-3 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-auto">
                                <h6 class="fw-bold text-muted small m-0">${cat.label}</h6>
                                <i class="bi ${cat.icon} text-${cat.color} fs-5"></i>
                            </div>
                            <div class="mt-3">
                                <div class="fs-4 fw-bold text-dark mb-1">${totalActual.toLocaleString(undefined,{maximumFractionDigits:1})} <small class="text-muted" style="font-size:0.7rem">Ha</small></div>
                                <div class="d-flex justify-content-between small">
                                    <span class="text-muted">Prestasi</span>
                                    <span class="fw-bold text-${cat.color}">${peratus}%</span>
                                </div>
                                <div class="progress mt-2" style="height:5px; border-radius:10px;">
                                    <div class="progress-bar bg-${cat.color}" style="width:${peratus}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        const overallP = globalTarget > 0 ? Math.min(100, (globalActual / globalTarget) * 100).toFixed(1) : 0;
        if(document.getElementById('overallProgressBar')) document.getElementById('overallProgressBar').style.width = overallP + '%';
        if(document.getElementById('overallProgressText')) document.getElementById('overallProgressText').innerText = `${overallP}% (${globalActual.toLocaleString(undefined,{maximumFractionDigits:1})} / ${globalTarget.toLocaleString()} Ha)`;
    },

    // 2. GRAF BAR
    renderStateChart: function(filterNegeri, fData) {
        const ctx = document.getElementById('stateAchievementChart');
        if(!ctx) return;
        if(this.stateChart) this.stateChart.destroy();
        
        let labels = [], data = [], colors = [], targets = [];
        const stateList = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops).sort();
        const palette = ['#0d6efd', '#20c997', '#fd7e14', '#6f42c1', '#e83e8c', '#198754', '#0dcaf0', '#f1c40f', '#dc3545', '#6610f2', '#e67e22', '#16a085', '#2980b9', '#8e44ad'];

        stateList.forEach((neg, index) => {
            let sasaran = 0;
            if(this.targetData[neg]) {
                sasaran = (this.targetData[neg]["BUAH-BUAHAN"]||0) + (this.targetData[neg]["SAYUR-SAYURAN"]||0) + (this.targetData[neg]["KONTAN"]||0) + (this.targetData[neg]["KELAPA"]||0);
            }
            
            let actual = 0;
            fData.forEach(d => { 
                if(this.getEffectiveState(d) === neg) {
                    actual += (parseFloat(d.lt) || 0); 
                }
            });
            
            let pct = sasaran > 0 ? ((actual / sasaran) * 100).toFixed(1) : 0;
            
            labels.push([neg.replace("W.P. ","").replace("CAMERON HIGHLANDS","C.H"), `${pct}%`]);
            data.push(actual.toFixed(2));
            targets.push(sasaran);
            colors.push(palette[index % palette.length]);
        });
        
        this.stateChart = new Chart(ctx, { 
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [{ data: data, targetsArr: targets, backgroundColor: colors, borderRadius: 5 }] 
            }, 
            options: { 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } } 
            } 
        });
    },

    // 3. LEADERBOARD
    renderStateLeaderboard: function(filterNegeri, fData) {
        const container = document.getElementById('stateProgressContainer');
        if(!container) return; 
        container.innerHTML = '';
        
        let stateList = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops);
        let arr = [];
        
        stateList.forEach(neg => {
            let sasaran = 0;
            if(this.targetData[neg]) {
                sasaran = (this.targetData[neg]["BUAH-BUAHAN"]||0) + (this.targetData[neg]["SAYUR-SAYURAN"]||0) + (this.targetData[neg]["KONTAN"]||0) + (this.targetData[neg]["KELAPA"]||0);
            }
            
            let actual = 0;
            fData.forEach(d => { 
                if(this.getEffectiveState(d) === neg) {
                    actual += (parseFloat(d.lt) || 0); 
                }
            });
            
            arr.push({ 
                state: neg, 
                pct: sasaran > 0 ? (actual / sasaran) * 100 : 0, 
                actual: actual, 
                target: sasaran 
            });
        });
        
        arr.sort((a, b) => b.pct - a.pct).forEach((item, idx) => {
            let color = item.pct >= 100 ? 'success' : (item.pct >= 50 ? 'primary' : 'danger');
            let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));
            
            container.innerHTML += `
                <div class="col">
                    <div class="bg-white p-2 rounded border shadow-sm h-100">
                        <div class="d-flex justify-content-between small fw-bold mb-1">
                            <span class="text-dark text-truncate">${medal} ${item.state}</span>
                            <span class="text-${color}">${item.pct.toFixed(1)}%</span>
                        </div>
                        <div class="progress" style="height:6px;">
                            <div class="progress-bar bg-${color}" style="width:${Math.min(100, item.pct)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    // 4. CARTA TREND
    renderTrendChart: function(filterNegeri, fData) {
        const ctx = document.getElementById('skuTrendChart');
        if(!ctx || !this.targetData) return;
        if(this.trendChart) this.trendChart.destroy();
        
        let monthly = new Array(12).fill(0);
        
        fData.forEach(d => {
            const eff = this.getEffectiveState(d);
            if(filterNegeri.length === 0 || filterNegeri.includes(eff)) {
                const dt = new Date(d.t);
                if(!isNaN(dt)) {
                    monthly[dt.getMonth()] += (parseFloat(d.lt) || 0);
                }
            }
        });
        
        this.trendChart = new Chart(ctx, { 
            type: 'bar', 
            data: { 
                labels: ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"], 
                datasets: [{ data: monthly, backgroundColor: '#0d6efd' }] 
            }, 
            options: { 
                maintainAspectRatio:false, 
                plugins: { legend: { display: false } } 
            } 
        });
    },

    // 5. KANBAN MATRIX
    renderMatrixGrid: function(filterNegeri, fData) {
        const container = document.getElementById('kanbanMatrixContainer');
        if(!container) return; 
        container.innerHTML = '';
        
        let states = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops).sort();
        
        states.forEach(neg => {
            const targetList = this.targetCrops[neg] || [];
            
            let stateHTML = `
                <div class="kanban-column" style="min-width:140px; flex:0 0 auto;">
                    <div class="fw-bold text-center border-bottom pb-2 mb-2 text-uppercase small">${neg}</div>
            `;
            
            targetList.sort().forEach(crop => {
                let actual = 0, count = 0;
                fData.forEach(d => { 
                    if(this.getEffectiveState(d) === neg && (d.tn||"").toUpperCase().trim() === crop) { 
                        count++; 
                        actual += (parseFloat(d.lt)||0); 
                    } 
                });
                
                if(count > 0) {
                    stateHTML += `<div class="kanban-item-done p-2 border border-success bg-success bg-opacity-10 rounded mb-1" style="font-size:0.7rem;">${crop} ✅</div>`;
                } else {
                    stateHTML += `<div class="kanban-item-pending p-2 border rounded mb-1 bg-white" style="font-size:0.7rem; border-style:dashed!important;">${crop} ⭕</div>`;
                }
            });
            
            container.innerHTML += stateHTML + `</div>`;
        });
    },

    // --- WOW FACTOR: JADUAL RUMUSAN ADMIN (PDF SAHAJA) ---
    renderAdminSummaryTable: function(filterNegeri, fData) {
        const section = document.getElementById('adminSummarySection');
        const container = document.getElementById('adminSummaryTableContainer');
        if(!section || !container) return;

        // Sekat jika bukan ADMIN (Bergantung kepada cara Tuan simpan role user)
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

        let html = `
        <table class="table table-sm table-bordered" style="font-size: 0.75rem; width:100%;">
            <thead class="table-dark text-center">
                <tr>
                    <th rowspan="2" class="align-middle">NEGERI</th>
                    <th colspan="3">BUAH-BUAHAN</th>
                    <th colspan="3">SAYUR-SAYURAN</th>
                    <th colspan="3">KONTAN/LAIN</th>
                    <th colspan="3">KELAPA</th>
                </tr>
                <tr style="font-size: 0.65rem;">
                    <th>SAS (Ha)</th><th>CAP (Ha)</th><th>%</th>
                    <th>SAS (Ha)</th><th>CAP (Ha)</th><th>%</th>
                    <th>SAS (Ha)</th><th>CAP (Ha)</th><th>%</th>
                    <th>SAS (Ha)</th><th>CAP (Ha)</th><th>%</th>
                </tr>
            </thead>
            <tbody>`;

        states.forEach(neg => {
            html += `<tr><td class="fw-bold">${neg}</td>`;
            
            cats.forEach(c => {
                let sasaran = this.targetData[neg] ? (this.targetData[neg][c.id] || 0) : 0;
                let actual = 0;
                
                fData.forEach(d => {
                    if(this.getEffectiveState(d) === neg) {
                        let dbK = (d.kt || "").toUpperCase();
                        let dbT = (d.tn || "").toUpperCase();
                        let isM = false;
                        
                        if (c.id === "BUAH-BUAHAN" && dbK.includes("BUAH")) isM = true;
                        else if (c.id === "SAYUR-SAYURAN" && dbK.includes("SAYUR")) isM = true;
                        else if (c.id === "KONTAN" && (dbK.includes("KONTAN") || dbK.includes("SINGKAT") || dbK.includes("LAIN"))) isM = true;
                        else if (c.id === "KELAPA" && (dbK.includes("KELAPA") || dbK.includes("INDUSTRI") || dbT.includes("KELAPA"))) isM = true;
                        
                        if (isM) {
                            actual += (parseFloat(d.lt) || 0);
                        }
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

    // 7. TANAMAN EXTRA
    renderExtraCrops: function(filterNegeri, fData) {
        const container = document.getElementById('extraCropsContainer');
        if(!container) return; 
        container.innerHTML = '';
        
        const states = filterNegeri.length > 0 ? filterNegeri : Object.keys(this.targetCrops).sort();
        
        states.forEach(neg => {
            const sasaran = this.targetCrops[neg] || [];
            let extra = {};
            
            fData.forEach(d => { 
                if(this.getEffectiveState(d) === neg) { 
                    let t = (d.tn||"").toUpperCase().trim(); 
                    if(!sasaran.includes(t) && t!=="") { 
                        extra[t] = (extra[t]||0) + (parseFloat(d.lt)||0); 
                    } 
                } 
            });
            
            if(Object.keys(extra).length > 0) {
                let badges = Object.keys(extra).map(c => `<span class="badge bg-info bg-opacity-10 text-dark border me-1 mb-1" style="font-size:0.6rem">${c} ${extra[c].toFixed(1)}Ha</span>`).join('');
                container.innerHTML += `<div class="col"><div class="card h-100 border-0 shadow-sm"><div class="card-header bg-white py-1 small fw-bold">${neg}</div><div class="card-body p-2">${badges}</div></div></div>`;
            }
        });
    },

    // 8. JADUAL RINGKASAN DETAIL (PDF)
    renderPrintSummaryTable: function(filterNegeri, fData) {
        const tbody = document.querySelector('#printSummaryTable tbody');
        if(!tbody) return;
        
        let sum = {};
        
        fData.forEach(d => {
            const eff = this.getEffectiveState(d);
            if(filterNegeri.length === 0 || filterNegeri.includes(eff)) {
                let k = (d.kt || "LAIN").toUpperCase();
                let t = (d.tn || "TIADA").toUpperCase();
                let key = k + "_" + t;
                
                if(!sum[key]) sum[key] = { k: k, t: t, c: 0, l: 0 };
                sum[key].c++; 
                sum[key].l += (parseFloat(d.lt) || 0);
            }
        });
        
        let html = '';
        Object.values(sum).sort((a,b) => a.k.localeCompare(b.k)).forEach(item => {
            html += `<tr><td>[${item.k}] ${item.t}</td><td class="text-center">${item.c}</td><td class="text-center">${item.l.toFixed(2)}</td></tr>`;
        });
        
        tbody.innerHTML = html || '<tr><td colspan="3" class="text-center">Tiada data untuk julat tarikh dipilih</td></tr>';
    },

    printPDF: function() { 
        const d = new Date();
        const dateEl = document.getElementById('printDate');
        const userEl = document.getElementById('printUser');
        
        if (dateEl) {
            dateEl.innerText = d.toLocaleDateString('ms-MY', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
        }
        if (userEl) {
            userEl.innerText = (AppState.uProf && AppState.uProf.name) ? AppState.uProf.name : 'Pegawai PNR';
        }
        
        window.print(); 
    }
};
