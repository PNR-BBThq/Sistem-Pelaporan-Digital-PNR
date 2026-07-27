// ==========================================
// FAIL: js/charts.js
// FUNGSI: Menguruskan Carta Bar dan Pie
// REDESIGN: Ranking-based Gradients, Direct Data Labels, Gridline Cleanup
// ==========================================

const ChartManager = {
    myPestChart: null,
    pieChart: null,
    chartLevel: 1,
    pilihanPerosak: "",
    pilihanTanaman: "",

    updateCharts: function(pm, km) { 
        if (typeof Chart === 'undefined') return;
        
        // Set default font family
        Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
        
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
                <div class="text-uppercase text-muted fw-bold mb-2 small d-flex justify-content-between align-items-center" style="font-size: 0.72rem; letter-spacing: 0.5px;">
                    <span>Tahap & Keterukan</span><span>Rekod & Nisbah</span>
                </div>
                <div class="d-flex flex-column gap-2" style="font-size: 0.84rem;">
                    <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: rgba(34, 197, 94, 0.06);">
                        <span class="d-flex align-items-center fw-bold"><span style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 8px;"></span> T1: Sangat Rendah</span>
                        <span class="fw-bold text-dark">${km[1]} <small class="text-muted">(${t1Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: rgba(132, 204, 22, 0.06);">
                        <span class="d-flex align-items-center fw-bold" style="color: #65a30d;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #84cc16; display: inline-block; margin-right: 8px;"></span> T2: Rendah</span>
                        <span class="fw-bold text-dark">${km[2]} <small class="text-muted">(${t2Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: rgba(234, 179, 8, 0.06);">
                        <span class="d-flex align-items-center fw-bold text-warning-emphasis"><span style="width: 10px; height: 10px; border-radius: 50%; background: #eab308; display: inline-block; margin-right: 8px;"></span> T3: Sederhana</span>
                        <span class="fw-bold text-dark">${km[3]} <small class="text-muted">(${t3Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: rgba(249, 115, 22, 0.06);">
                        <span class="d-flex align-items-center fw-bold" style="color: #ea580c;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #f97316; display: inline-block; margin-right: 8px;"></span> T4: Teruk (Tinggi)</span>
                        <span class="fw-bold text-dark">${km[4]} <small class="text-muted">(${t4Pct}%)</small></span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: rgba(239, 68, 68, 0.06);">
                        <span class="d-flex align-items-center fw-bold text-danger"><span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block; margin-right: 8px;"></span> T5: Sangat Teruk (Wabak)</span>
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
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 8,
                        hoverBorderWidth: 0
                    }] 
                }, 
                options: { 
                    maintainAspectRatio: false, 
                    cutout: '72%',
                    animation: {
                        animateRotate: true,
                        duration: 800,
                        easing: 'easeOutQuart'
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.92)',
                            padding: 14,
                            titleFont: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                            bodyFont: { size: 12, family: "'Inter', sans-serif" },
                            cornerRadius: 10,
                            displayColors: true,
                            boxPadding: 4,
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

        let labelX = [], dataY = [], tajuk = "", sub = "";

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
            this.chartLevel = 1; 
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
            this.chartLevel = 2; this.pilihanPerosak = namaPest; 
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
            this.chartLevel = 3; this.pilihanTanaman = namaTanaman; 
            const btn = document.getElementById('btnBackPest');
            if(btn) btn.style.display = 'inline-block';
        }

        const tajukEl = document.getElementById('tajukCBar');
        const subEl = document.getElementById('subCBar');
        if (tajukEl) tajukEl.innerText = tajuk;
        if (subEl) subEl.innerHTML = `<i class="bi bi-hand-index-thumb-fill text-primary me-1"></i> ${sub}`;

        // Create ranking-based gradient colors for each bar according to rank
        const rankColorPairs = [
            ['#ef4444', '#dc2626'], // Rank 1: Red
            ['#f97316', '#ea580c'], // Rank 2: Orange
            ['#f59e0b', '#d97706'], // Rank 3: Amber
            ['#84cc16', '#65a30d'], // Rank 4: Lime
            ['#10b981', '#059669'], // Rank 5: Emerald
            ['#06b6d4', '#0891b2'], // Rank 6: Cyan
            ['#3b82f6', '#2563eb'], // Rank 7: Blue
            ['#6366f1', '#4f46e5'], // Rank 8: Indigo
            ['#8b5cf6', '#7c3aed'], // Rank 9: Violet
            ['#ec4899', '#db2777']  // Rank 10: Pink
        ];

        const barCount = labelX.length || 1;
        const bgGradients = [];
        const hoverGradients = [];

        for (let i = 0; i < barCount; i++) {
            const pair = rankColorPairs[i % rankColorPairs.length];
            const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
            g.addColorStop(0, pair[0]);
            g.addColorStop(1, pair[1]);
            bgGradients.push(g);

            const hg = ctx.createLinearGradient(0, 0, canvas.width, 0);
            hg.addColorStop(0, pair[1]);
            hg.addColorStop(1, pair[0]);
            hoverGradients.push(hg);
        }

        // Inline plugin to render values directly at the end of each bar
        const barEndLabelsPlugin = {
            id: 'barEndLabelsPlugin',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                chart.data.datasets.forEach((dataset, datasetIdx) => {
                    const meta = chart.getDatasetMeta(datasetIdx);
                    meta.data.forEach((bar, index) => {
                        const val = dataset.data[index];
                        if (val !== undefined && val !== null && val > 0) {
                            ctx.save();
                            ctx.fillStyle = '#475569';
                            ctx.font = "bold 11px 'Inter', sans-serif";
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';
                            const textStr = `${parseFloat(val).toFixed(2)} Ha`;
                            ctx.fillText(textStr, bar.x + 8, bar.y);
                            ctx.restore();
                        }
                    });
                });
            }
        };

        const self = this;
        this.myPestChart = new Chart(ctx, { 
            type: 'bar', 
            data: { 
                labels: labelX.length ? labelX : ['Tiada Data'], 
                datasets: [{ 
                    label: 'Luas Serangan (Ha)', 
                    data: dataY.length ? dataY : [0], 
                    backgroundColor: bgGradients, 
                    hoverBackgroundColor: hoverGradients,
                    borderRadius: 10,
                    barThickness: 'flex',
                    maxBarThickness: 26,
                    borderSkipped: false
                }] 
            }, 
            plugins: [barEndLabelsPlugin],
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                layout: {
                    padding: {
                        right: 75 // Extra right padding for end-of-bar labels
                    }
                },
                animation: {
                    duration: 600,
                    easing: 'easeOutQuart'
                },
                plugins: { 
                    legend: { display: false }, 
                    title: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        padding: 14,
                        titleFont: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                        bodyFont: { size: 13, family: "'Inter', sans-serif" },
                        cornerRadius: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return ` Luas Serangan: ${parseFloat(context.parsed.x || 0).toFixed(2)} Ha`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }, // Remove vertical gridlines
                        ticks: { font: { size: 11, weight: '600', family: "'Inter', sans-serif" }, color: '#94a3b8' },
                        border: { display: false }
                    },
                    y: {
                        grid: { display: false }, // Remove gridlines
                        ticks: { font: { size: 12, weight: 'bold', family: "'Inter', sans-serif" }, color: '#1e293b' },
                        border: { display: false }
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
