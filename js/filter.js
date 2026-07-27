// ==========================================
// FAIL: js/filter.js
// FUNGSI: Menguruskan Dropdown Menu & Tapisan Data (Cascading, Filter Bulan & Multi-Select Controls)
// ==========================================

const FilterManager = {
    
    // Helper function to get values from filter controls
    v: function(id) { 
        if (id === 'dS' || id === 'dE' || id === 'selBulan') { 
            const el = document.getElementById(id); 
            return el ? el.value : ""; 
        }
        const checkboxes = document.querySelectorAll('.chk-' + id + ':checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },

    // Populate the Bulan dropdown dynamically based on available dates in dataset
    initBulanDropdown: function() {
        const selBulan = document.getElementById('selBulan');
        if (!selBulan) return;

        const currentVal = selBulan.value;
        const monthsSet = new Set();

        (AppState.mData || []).forEach(r => {
            if (r.t) {
                const dateStr = String(r.t).trim();
                let ym = "";
                if (dateStr.includes('-')) {
                    const parts = dateStr.split('T')[0].split('-');
                    if (parts.length >= 2) ym = `${parts[0]}-${parts[1]}`;
                } else if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) ym = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                }
                if (ym) monthsSet.add(ym);
            }
        });

        const sortedYM = Array.from(monthsSet).sort().reverse();
        
        const monthNamesMalay = {
            '01': 'Januari', '02': 'Februari', '03': 'Mac', '04': 'April',
            '05': 'Mei', '06': 'Jun', '07': 'Julai', '08': 'Ogos',
            '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Disember'
        };

        let html = '<option value="">- Semua Bulan -</option>';
        sortedYM.forEach(ym => {
            const [y, m] = ym.split('-');
            const label = `${monthNamesMalay[m] || m} ${y}`;
            const selected = (ym === currentVal) ? 'selected' : '';
            html += `<option value="${ym}" ${selected}>${label}</option>`;
        });

        selBulan.innerHTML = html;

        if (!selBulan.getAttribute('data-bound')) {
            selBulan.addEventListener('change', () => {
                // If Bulan is chosen, reset specific date range inputs
                if (selBulan.value) {
                    const dS = document.getElementById('dS');
                    const dE = document.getElementById('dE');
                    if (dS) dS.value = "";
                    if (dE) dE.value = "";
                }
                FilterManager.runFilter('bulan');
            });
            selBulan.setAttribute('data-bound', 'true');
        }

        // Attach date inputs change listener to reset Bulan filter if user picks date range
        ['dS', 'dE'].forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.getAttribute('data-bound')) {
                el.addEventListener('change', () => {
                    if (el.value && selBulan) selBulan.value = "";
                    FilterManager.runFilter(id);
                });
                el.setAttribute('data-bound', 'true');
            }
        });
    },

    runFilter: function(source) {
        // Init Month dropdown if not initialized yet
        this.initBulanDropdown();

        const n = this.v('selNegeri');
        const d = this.v('selDaerah');
        const t = this.v('selTanaman');
        const p = this.v('selPerosak');
        const k = this.v('selKategori');
        const bulan = this.v('selBulan');
        const s = this.v('dS');
        const e = this.v('dE');
        
        // 1. FILTER PRIMARY SYSTEM DATASET
        AppState.fData = AppState.mData.filter(r => { 
            let pestOk = true; 
            if (p.length > 0) {
                pestOk = false;
                if (r.p) {
                    try { 
                        const pestObj = (typeof r.p === 'string' ? JSON.parse(r.p) : r.p);
                        pestOk = p.some(selectedPest => pestObj[selectedPest]);
                    } catch(err) {}
                }
            }

            // Month filter matching
            let bulanOk = true;
            if (bulan) {
                let recYM = "";
                if (r.t) {
                    const str = String(r.t).trim();
                    if (str.includes('-')) {
                        const parts = str.split('T')[0].split('-');
                        if (parts.length >= 2) recYM = `${parts[0]}-${parts[1]}`;
                    } else if (str.includes('/')) {
                        const parts = str.split('/');
                        if (parts.length === 3) recYM = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                    }
                }
                bulanOk = (recYM === bulan);
            }

            return (n.length === 0 || n.includes(r.n)) && 
                   (d.length === 0 || d.includes(r.d)) && 
                   (t.length === 0 || t.includes(r.tn)) && 
                   (k.length === 0 || k.includes(r.kt)) && 
                   pestOk && bulanOk && (!s || r.t >= s) && (!e || r.t <= e);
        });

        // 2. CASCADING DEPENDENT DROPDOWNS LOGIC
        // Negeri <-> Daerah
        if (source === 'd' && d.length > 0 && n.length === 0) {
            // Auto highlight/select Negeri if Daerah was selected first
            const matchingStates = [...new Set(AppState.mData.filter(r => d.includes(r.d)).map(r => r.n).filter(Boolean))];
            if (matchingStates.length > 0) {
                document.querySelectorAll('.chk-selNegeri').forEach(cb => {
                    if (matchingStates.includes(cb.value)) cb.checked = true;
                });
                this.updateBtnText('selNegeri');
            }
        }

        // Update Daerah options based on Negeri selection
        if (source === 'n' || !source) { 
            const dataD = AppState.mData.filter(r => n.length === 0 || n.includes(r.n)); 
            this.updateDropdown('selDaerah', [...new Set(dataD.map(x=>x.d).filter(Boolean))].sort(), d, 'd'); 
        }

        // Perosak <-> Tanaman reciprocal cascading
        if (source === 'p' && p.length > 0 && t.length === 0) {
            // Auto update Tanaman options based on selected Perosak
            const dataPests = AppState.mData.filter(r => {
                if (!r.p) return false;
                try {
                    const pObj = typeof r.p === 'string' ? JSON.parse(r.p) : r.p;
                    return p.some(selP => pObj[selP]);
                } catch(e) { return false; }
            });
            const matchingCrops = [...new Set(dataPests.map(r => r.tn).filter(Boolean))].sort();
            this.updateDropdown('selTanaman', matchingCrops, t, 't');
        } else if (source === 'd' || source === 'n' || !source) { 
            const dataT = AppState.mData.filter(r => (n.length === 0 || n.includes(r.n)) && (d.length === 0 || d.includes(r.d))); 
            this.updateDropdown('selTanaman', [...new Set(dataT.map(x=>x.tn).filter(Boolean))].sort(), t, 't'); 
        }

        // Update Kategori & Perosak options based on current state, district, crop selection
        if (source === 't' || source === 'd' || source === 'n' || !source) {
            const dataRest = AppState.mData.filter(r => 
                (n.length === 0 || n.includes(r.n)) && 
                (d.length === 0 || d.includes(r.d)) && 
                (t.length === 0 || t.includes(r.tn))
            );
            this.updateDropdown('selKategori', [...new Set(dataRest.map(x=>x.kt).filter(Boolean))].sort(), k, 'k');
            
            let allPests = new Set(); 
            dataRest.forEach(r => { 
                try { 
                    let obj = typeof r.p === 'string' ? JSON.parse(r.p) : r.p; 
                    if(obj) Object.keys(obj).forEach(x => allPests.add(x)); 
                } catch(err){} 
            });
            this.updateDropdown('selPerosak', [...allPests].sort(), p, 'p');
        }
        
        // 3. REFRESH MAIN DASHBOARD
        AppState.pg = 1; 
        DashboardManager.calcUI();

        // 4. UPDATE ACTIVE FILTER COUNT BADGE
        this.updateFilterCount();

        // 5. REFRESH SKU DASHBOARD IF OPEN
        const viewSKU = document.getElementById('view-sku');
        if (viewSKU && viewSKU.style.display !== 'none' && typeof KPIManager !== 'undefined') {
            KPIManager.renderDashboard();
        }
    },

    updateDropdown: function(id, list, curValArray, srcCode) { 
        const menu = document.getElementById('list' + id); 
        if (!menu) {
            const container = document.getElementById('filterDropdownsContainer');
            if (container) {
                const labelMap = { 'selNegeri': 'Negeri', 'selDaerah': 'Daerah', 'selTanaman': 'Tanaman', 'selPerosak': 'Perosak', 'selKategori': 'Kategori' };
                const iconMap = { 'selNegeri': 'bi-geo-alt', 'selDaerah': 'bi-pin-map', 'selTanaman': 'bi-flower1', 'selPerosak': 'bi-bug', 'selKategori': 'bi-tag' };
                const html = `
                <div class="filter-group">
                    <label class="filter-label"><i class="bi ${iconMap[id] || 'bi-funnel'} me-1"></i>${labelMap[id]}</label>
                    <div class="dropdown d-grid">
                        <button class="btn btn-white border text-start text-truncate dropdown-toggle btn-sm bg-white" type="button" id="btn${id}" data-bs-toggle="dropdown" data-bs-auto-close="outside">- Semua -</button>
                        <div class="dropdown-menu w-100 p-2 shadow-sm" style="max-height: 280px; overflow-y: auto; border-radius: var(--radius-md);" id="list${id}"></div>
                    </div>
                </div>`;
                container.insertAdjacentHTML('beforeend', html);
            }
        }
        
        const menuEl = document.getElementById('list' + id);
        if (!menuEl) return;
        
        menuEl.innerHTML = ''; 

        // Quick multi-select action header ("Pilih Semua" & "Kosongkan Semua")
        if (list && list.length > 0) {
            const ctrlHeader = document.createElement('div');
            ctrlHeader.className = 'd-flex justify-content-between align-items-center pb-2 mb-2 border-bottom px-1';
            ctrlHeader.style.fontSize = '0.75rem';
            ctrlHeader.innerHTML = `
                <button type="button" class="btn btn-link btn-xs p-0 text-primary fw-bold text-decoration-none" onclick="FilterManager.selectAll('${id}', '${srcCode}')">
                    <i class="bi bi-check-all me-1"></i>Pilih Semua
                </button>
                <button type="button" class="btn btn-link btn-xs p-0 text-secondary text-decoration-none" onclick="FilterManager.clearAll('${id}', '${srcCode}')">
                    <i class="bi bi-x-circle me-1"></i>Kosongkan
                </button>`;
            menuEl.appendChild(ctrlHeader);
        } else {
            menuEl.innerHTML = '<div class="text-muted small px-2 py-1 fst-italic">Tiada pilihan tersedia</div>';
            this.updateBtnText(id);
            return;
        }

        list.forEach(x => { 
            const isChecked = (curValArray && curValArray.includes(x)) ? 'checked' : '';
            const cleanId = 'chk_' + id + '_' + x.replace(/[^a-zA-Z0-9]/g, '');
            const div = document.createElement('div');
            div.className = 'form-check mb-1';
            div.innerHTML = `<input class="form-check-input chk-${id}" type="checkbox" value="${x}" id="${cleanId}" ${isChecked}>
                             <label class="form-check-label w-100 text-truncate" style="font-size:0.82rem; cursor:pointer;" for="${cleanId}">${x}</label>`;
            
            div.querySelector('input').addEventListener('change', () => {
                FilterManager.updateBtnText(id);
                FilterManager.runFilter(srcCode);
            });
            menuEl.appendChild(div);
        }); 
        this.updateBtnText(id);
    },

    // Quick select all items for a multi-select dropdown
    selectAll: function(id, srcCode) {
        document.querySelectorAll('.chk-' + id).forEach(cb => {
            if (!cb.disabled) cb.checked = true;
        });
        this.updateBtnText(id);
        this.runFilter(srcCode);
    },

    // Quick clear all items for a multi-select dropdown
    clearAll: function(id, srcCode) {
        document.querySelectorAll('.chk-' + id).forEach(cb => {
            if (!cb.disabled) cb.checked = false;
        });
        this.updateBtnText(id);
        this.runFilter(srcCode);
    },

    updateBtnText: function(id) {
        const btn = document.getElementById('btn' + id);
        if (!btn) return;
        const checked = Array.from(document.querySelectorAll('.chk-' + id + ':checked')).map(cb => cb.value);
        if (checked.length === 0) { 
            btn.innerText = '- Semua -'; 
            btn.classList.remove('fw-bold','text-primary'); 
        }
        else if (checked.length === 1) { 
            btn.innerText = checked[0]; 
            btn.classList.add('fw-bold','text-primary'); 
        }
        else { 
            btn.innerText = checked.length + ' Dipilih'; 
            btn.classList.add('fw-bold','text-primary'); 
        }
    },

    fillSel: function(id, arr, srcCode) { 
        this.updateDropdown(id, arr, [], srcCode); 
    },

    resetFilter: function(){ 
        document.querySelectorAll('.form-check-input').forEach(cb => { if(!cb.disabled) cb.checked = false; });
        document.querySelectorAll('input[type=date]').forEach(e => e.value=""); 
        const selBulan = document.getElementById('selBulan');
        if (selBulan) selBulan.value = "";

        ['selNegeri', 'selDaerah', 'selTanaman', 'selPerosak', 'selKategori'].forEach(id => FilterManager.updateBtnText(id));
        FilterManager.runFilter('n'); 
    },

    updateFilterCount: function() {
        const el = document.getElementById('filterActiveCount');
        if (!el) return;
        
        let activeCount = 0;
        ['selNegeri', 'selDaerah', 'selTanaman', 'selPerosak', 'selKategori'].forEach(id => {
            if (this.v(id).length > 0) activeCount++;
        });
        if (this.v('selBulan')) activeCount++;
        if (this.v('dS')) activeCount++;
        if (this.v('dE')) activeCount++;

        if (activeCount > 0) {
            el.innerHTML = `<span style="background: var(--primary-subtle); color: var(--primary); padding: 5px 12px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.75rem;"><i class="bi bi-funnel-fill me-1"></i>${activeCount} aktif</span>`;
        } else {
            el.innerHTML = '';
        }
    }
};
