// ==========================================
// FAIL: js/charts.js
// FUNGSI: Menguruskan Carta Bar dan Pie
// ==========================================

const ChartManager = {
    myPestChart: null,
    pieChart: null,
    chartLevel: 1,
    pilihanPerosak: "",
    pilihanTanaman: "",

    updateCharts: function(pm, km) { 
        if (typeof Chart === 'undefined') return;
        
        if (this.pieChart) this.pieChart.destroy(); 
        
        let totalCount = Object.values(km).reduce((a,b) => a + (parseInt(b) || 0), 0);
        let t1Pct = totalCount > 0 ? Math.round((km[1]/totalCount)*100) : 0;
        let t2Pct = totalCount > 0 ? Math.round((km[2]/totalCount)*100) : 0;
        let t3Pct = totalCount > 0 ? Math.round((km[3]/totalCount)*100) : 0;
        let t4Pct = totalCount > 0 ? Math.round((km[4]/totalCount)*100) : 0;
        let t5Pct = totalCount > 0 ? Math.round((km[5]/totalCount)*100) : 0;
        
        const legendContainer = document.getElementById('legendContainer');
        if (legendContainer) {
            legendContainer.innerHTML = `
                <div class="text-uppercase text-muted fw-bold mb-2 small d-flex justify-content-between align-items-center" style="font-size: 0.75rem; letter-spacing: 0.5px;">
                    <span>Tahap & Keterukan</span><span>Rekod & Nisbah</span>
                </div>
                <div class="d-flex flex-column gap-2" style="font-size: 0.85rem;">
                    <div class="d-flex justify-content-between align-items-center p-1 rounded">
                        <span class="d-flex align-items-center fw-bold"><i class="bi bi-circle-fill text-success me-2"></i> T1: Sangat Rendah</span>
                        <span class="fw-bold text-dark">${km[1]} <small class="text-muted">(${t1Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-1 rounded">
                        <span class="d-flex align-items-center fw-bold" style="color: #65a30d;"><i class="bi bi-circle-fill me-2" style="color: #84cc16;"></i> T2: Rendah</span>
                        <span class="fw-bold text-dark">${km[2]} <small class="text-muted">(${t2Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-1 rounded">
                        <span class="d-flex align-items-center fw-bold text-warning-emphasis"><i class="bi bi-circle-fill text-warning me-2"></i> T3: Sederhana</span>
                        <span class="fw-bold text-dark">${km[3]} <small class="text-muted">(${t3Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-1 rounded">
                        <span class="d-flex align-items-center fw-bold" style="color: #ea580c;"><i class="bi bi-circle-fill me-2" style="color: #f97316;"></i> T4: Teruk (Tinggi)</span>
                        <span class="fw-bold text-dark">${km[4]} <small class="text-muted">(${t4Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-1 rounded">
                        <span class="d-flex align-items-center fw-bold text-danger"><i class="bi bi-circle-fill text-danger me-2"></i> T5: Sangat Teruk (Wabak)</span>
                        <span class="fw-bold text-dark">${km[5]} <small class="text-muted">(${t5Pct}%)</small></span>
                    </div>
                </div>
            `;
        }

        const ctxPie = document.getElementById('cPie');
        if (ctxPie) {
            this.pieChart = new Chart(ctxPie, { 
                type: 'doughnut', 
                data: { 
                    labels: ['T1: Sgt Rendah', 'T2: Rendah', 'T3: Sederhana', 'T4: Teruk', 'T5: Sgt Teruk (Wabak)'], 
                    datasets: [{ 
                        data: [km[1], km[2], km[3], km[4], km[5]], 
                        backgroundColor: ['#22c55e','#84cc16','#eab308','#f97316','#ef4444'], 
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 6
                    }] 
                }, 
                options: { 
                    maintainAspectRatio: false, 
                    cutout: '74%',
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    let val = context.parsed || 0;
                                    let p = totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${val} rekod (${p}%)`;
                                }
                            }
                        }
                    } 
                } 
            });
        }
        
        this.lukisCartaPerosak(1);
        
        const btnBack = document.getElementById('btnBackPest');
        if (btnBack && !btnBack.hasAttribute('data-bound')) {
            btnBack.addEventListener('click', () => this.patahBalikCarta());
            btnBack.setAttribute('data-bound', 'true');
        }
    },

    lukisCartaPerosak: function(level, namaPest = "", namaTanaman = "") {
        if (typeof Chart === 'undefined') return;
        const canvas = document.getElementById('cBar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d'); 
        if (this.myPestChart) this.myPestChart.destroy();

        let labelX = [], dataY = [], tajuk = "", warna = "", warnaHover = "", sub = "";

        if (level === 1) {
            let kiraPerosak = {};
            AppState.fData.forEach(item => { 
                try { 
                    let pObj = typeof item.p === 'string' ? JSON.parse(item.p) : item.p; 
                    if (pObj && Object.keys(pObj).length > 0) {
                        Object.entries(pObj).forEach(([nPest, luas]) => { kiraPerosak[nPest] = (kiraPerosak[nPest]||0) + parseFloat(luas); }); 
                    } else if (parseFloat(item.ls) > 0) {
                        kiraPerosak["Serangan Umum"] = (kiraPerosak["Serangan Umum"]||0) + parseFloat(item.ls);
                    }
                } catch(e) {
                    if (parseFloat(item.ls) > 0) kiraPerosak["Serangan Umum"] = (kiraPerosak["Serangan Umum"]||0) + parseFloat(item.ls);
                } 
            });
            let top10 = Object.entries(kiraPerosak).sort((a,b)=>b[1]-a[1]).slice(0,10);
            labelX = top10.map(x => x[0].toUpperCase()); dataY = top10.map(x => x[1]); 
            tajuk = "Top 10 Perosak Tertinggi (Ha)"; sub = "Klik pada bar untuk lihat pecahan tanaman"; 
            warna = "#f43f5e"; warnaHover = "#e11d48"; this.chartLevel = 1; 
            const btn = document.getElementById('btnBackPest');
            if(btn) btn.style.display = 'none';
        } 
        else if (level === 2) {
            let kiraTanaman = {};
            let matchTarget = namaPest.trim().toLowerCase();
            AppState.fData.forEach(item => { 
                try { 
                    let pObj = typeof item.p === 'string' ? JSON.parse(item.p) : item.p; 
                    if (pObj) {
                        Object.entries(pObj).forEach(([pName, pVal]) => {
                            if (pName.trim().toLowerCase() === matchTarget) {
                                let tn = (item.tn || "UMUM").toUpperCase();
                                kiraTanaman[tn] = (kiraTanaman[tn]||0) + parseFloat(pVal);
                            }
                        });
                    } else if (matchTarget === "serangan umum" && parseFloat(item.ls) > 0) {
                        let tn = (item.tn || "UMUM").toUpperCase();
                        kiraTanaman[tn] = (kiraTanaman[tn]||0) + parseFloat(item.ls);
                    }
                } catch(e) {} 
            });
            let susun = Object.entries(kiraTanaman).sort((a,b)=>b[1]-a[1]).slice(0, 10);
            labelX = susun.map(x=>x[0]); dataY = susun.map(x=>x[1]); 
            tajuk = `Tanaman Diserang: ${namaPest} (Ha)`; sub = "Klik pada bar tanaman untuk lihat pecahan daerah"; 
            warna = "#3b82f6"; warnaHover = "#2563eb"; this.chartLevel = 2; this.pilihanPerosak = namaPest; 
            const btn = document.getElementById('btnBackPest');
            if(btn) btn.style.display = 'inline-block';
        } 
        else if (level === 3) {
            let kiraDaerah = {};
            let matchTarget = this.pilihanPerosak.trim().toLowerCase();
            let cropTarget = namaTanaman.trim().toLowerCase();
            AppState.fData.forEach(item => { 
                try { 
                    if ((item.tn || "").trim().toLowerCase() === cropTarget) {
                        let pObj = typeof item.p === 'string' ? JSON.parse(item.p) : item.p; 
                        let daerahName = `${item.d || '-'} (${item.n || '-'})`.toUpperCase();
                        if (pObj) {
                            Object.entries(pObj).forEach(([pName, pVal]) => {
                                if (pName.trim().toLowerCase() === matchTarget) {
                                    kiraDaerah[daerahName] = (kiraDaerah[daerahName]||0) + parseFloat(pVal);
                                }
                            });
                        } else if (matchTarget === "serangan umum" && parseFloat(item.ls) > 0) {
                            kiraDaerah[daerahName] = (kiraDaerah[daerahName]||0) + parseFloat(item.ls);
                        }
                    }
                } catch(e) {} 
            });
            let susun = Object.entries(kiraDaerah).sort((a,b)=>b[1]-a[1]).slice(0, 15);
            labelX = susun.map(x=>x[0]); dataY = susun.map(x=>x[1]); 
            tajuk = `Daerah Terlibat: ${namaTanaman} - ${this.pilihanPerosak} (Ha)`; sub = "Pecahan terperinci mengikut daerah & negeri"; 
            warna = "#10b981"; warnaHover = "#059669"; this.chartLevel = 3; this.pilihanTanaman = namaTanaman; 
            const btn = document.getElementById('btnBackPest');
            if(btn) btn.style.display = 'inline-block';
        }

        const tajukEl = document.getElementById('tajukCBar');
        const subEl = document.getElementById('subCBar');
        if (tajukEl) tajukEl.innerText = tajuk;
        if (subEl) subEl.innerHTML = `<i class="bi bi-hand-index-thumb-fill text-primary me-1"></i> ${sub}`;

        const self = this;
        this.myPestChart = new Chart(ctx, { 
            type: 'bar', 
            data: { 
                labels: labelX.length ? labelX : ['Tiada Data'], 
                datasets: [{ 
                    label: 'Luas Serangan (Ha)', 
                    data: dataY.length ? dataY : [0], 
                    backgroundColor: warna, 
                    hoverBackgroundColor: warnaHover,
                    borderRadius: 6,
                    barThickness: 'flex',
                    maxBarThickness: 30
                }] 
            }, 
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false }, 
                    title: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return ` Luas Serangan: ${parseFloat(context.parsed.x || 0).toFixed(2)} Ha`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#f1f5f9', drawBorder: false },
                        ticks: { font: { size: 11, weight: '600' }, color: '#64748b' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 12, weight: 'bold' }, color: '#1e293b' }
                    }
                },
                onClick: (event, elements) => { 
                    if (elements.length > 0) { 
                        const index = elements[0].index; 
                        const labelDiKlik = self.myPestChart.data.labels[index]; 
                        if (self.chartLevel === 1) self.lukisCartaPerosak(2, labelDiKlik); 
                        else if (self.chartLevel === 2) self.lukisCartaPerosak(3, self.pilihanPerosak, labelDiKlik); 
                    } 
                } 
            } 
        });
    },

    patahBalikCarta: function() { 
        if (this.chartLevel === 3) this.lukisCartaPerosak(2, this.pilihanPerosak); 
        else if (this.chartLevel === 2) this.lukisCartaPerosak(1); 
    }
};
