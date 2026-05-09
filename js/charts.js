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
        
        // CARTA PIE KETERUKAN
        if(this.pieChart) this.pieChart.destroy(); 
        
        // Label Keterukan
        const legendContainer = document.getElementById('legendContainer');
        if(legendContainer) {
            legendContainer.innerHTML = `
                <p class="text-uppercase text-muted fw-bold mb-2" style="font-size: 10px; letter-spacing: 1px;">Petunjuk Tahap</p>
                <div class="d-flex flex-wrap justify-content-center gap-2" style="font-size: 11px;">
                    <span class="badge rounded-pill bg-success bg-opacity-75 text-white">T1: Sgt Rendah</span>
                    <span class="badge rounded-pill bg-info text-dark">T2: Rendah</span>
                    <span class="badge rounded-pill bg-warning text-dark">T3: Sederhana</span>
                    <span class="badge rounded-pill text-white" style="background-color: #fd7e14;">T4: Teruk</span>
                    <span class="badge rounded-pill bg-danger text-white">T5: Sgt Teruk</span>
                </div>
            `;
        }

        this.pieChart = new Chart(document.getElementById('cPie'), { 
            type: 'doughnut', 
            data: { 
                labels: ['T1','T2','T3','T4','T5'], 
                datasets: [{ data: Object.values(km), backgroundColor: ['#22c55e','#84cc16','#eab308','#f97316','#ef4444'], borderWidth:0 }] 
            }, 
            options: { maintainAspectRatio: false, plugins:{legend:{position:'right'}} } 
        }); 
        
        // Panggil Carta Bar interaktif yang baru
        this.lukisCartaPerosak(1);
        
        // Event Listener untuk Butang Kembali pada carta
        const btnBack = document.getElementById('btnBackPest');
        if(btnBack && !btnBack.hasAttribute('data-bound')) {
            btnBack.addEventListener('click', () => this.patahBalikCarta());
            btnBack.setAttribute('data-bound', 'true');
        }
    },

    lukisCartaPerosak: function(level, namaPest = "", namaTanaman = "") {
        if (typeof Chart === 'undefined') return;
        const ctx = document.getElementById('cBar').getContext('2d'); 
        if(this.myPestChart) this.myPestChart.destroy();

        let labelX = [], dataY = [], tajuk = "", warna = "", sub = "";

        if (level === 1) {
            // TAHAP 1: TOP 10 PEROSAK
            let kiraPerosak = {};
            AppState.fData.forEach(item => { 
                try { 
                    let pObj = typeof item.p === 'string' ? JSON.parse(item.p) : item.p; 
                    if(pObj) Object.entries(pObj).forEach(([nPest, luas]) => { kiraPerosak[nPest] = (kiraPerosak[nPest]||0) + parseFloat(luas); }); 
                } catch(e){} 
            });
            let top10 = Object.entries(kiraPerosak).sort((a,b)=>b[1]-a[1]).slice(0,10);
            labelX = top10.map(x=>x[0]); dataY = top10.map(x=>x[1]); 
            tajuk = "Top 10 Perosak Tertinggi (Ha)"; sub = "Klik pada bar untuk lihat pecahan tanaman"; 
            warna = "#ef4444"; this.chartLevel = 1; 
            document.getElementById('btnBackPest').style.display = 'none';
        } 
        else if (level === 2) {
            // TAHAP 2: PECAHAN TANAMAN
            let kiraTanaman = {};
            AppState.fData.forEach(item => { 
                try { 
                    let pObj = typeof item.p === 'string' ? JSON.parse(item.p) : item.p; 
                    if(pObj && pObj[namaPest]) kiraTanaman[item.tn] = (kiraTanaman[item.tn]||0) + parseFloat(pObj[namaPest]); 
                } catch(e){} 
            });
            let susun = Object.entries(kiraTanaman).sort((a,b)=>b[1]-a[1]);
            labelX = susun.map(x=>x[0]); dataY = susun.map(x=>x[1]); 
            tajuk = `Tanaman Diserang: ${namaPest} (Ha)`; sub = "Klik pada bar untuk lihat pecahan daerah"; 
            warna = "#eab308"; this.chartLevel = 2; this.pilihanPerosak = namaPest; 
            document.getElementById('btnBackPest').style.display = 'inline-block';
        } 
        else if (level === 3) {
            // TAHAP 3: PECAHAN DAERAH
            let kiraDaerah = {};
            AppState.fData.forEach(item => { 
                try { 
                    let pObj = typeof item.p === 'string' ? JSON.parse(item.p) : item.p; 
                    if(pObj && pObj[namaPest] && item.tn === namaTanaman) kiraDaerah[item.d] = (kiraDaerah[item.d]||0) + parseFloat(pObj[namaPest]); 
                } catch(e){} 
            });
            let susun = Object.entries(kiraDaerah).sort((a,b)=>b[1]-a[1]);
            labelX = susun.map(x=>x[0]); dataY = susun.map(x=>x[1]); 
            tajuk = `Daerah Terlibat: ${namaTanaman} - ${namaPest} (Ha)`; sub = "Pecahan terperinci mengikut daerah"; 
            warna = "#3b82f6"; this.chartLevel = 3; this.pilihanTanaman = namaTanaman; 
            document.getElementById('btnBackPest').style.display = 'inline-block';
        }

        const tajukEl = document.getElementById('tajukCBar');
        const subEl = document.getElementById('subCBar');
        if(tajukEl) tajukEl.innerText = tajuk;
        if(subEl) subEl.innerHTML = `<i class="bi bi-hand-index-thumb-fill text-primary me-1"></i> ${sub}`;

        const self = this;
        this.myPestChart = new Chart(ctx, { 
            type: 'bar', 
            data: { labels: labelX, datasets: [{ label: 'Luas Serangan (Ha)', data: dataY, backgroundColor: warna, borderRadius: 4 }] }, 
            options: { 
                indexAxis: 'y', responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false }, title: { display: false } },
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
