// ==========================================
// FAIL: js/filter.js
// FUNGSI: Menguruskan Dropdown Menu & Tapisan Data
// ==========================================

const FilterManager = {
    
    // Fungsi bantuan untuk dapatkan nilai kotak tapisan
    v: function(id) { 
        if(id === 'dS' || id === 'dE' || id === 'fMonth') { 
            const el = document.getElementById(id); 
            return el ? el.value : ""; 
        }
        const checkboxes = document.querySelectorAll('.chk-' + id + ':checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },

    runFilter: function(source) {
        const n = this.v('selNegeri');
        const d = this.v('selDaerah');
        const t = this.v('selTanaman');
        const p = this.v('selPerosak');
        const k = this.v('selKategori');
        let s = this.v('dS');
        let e = this.v('dE');
        let m = this.v('fMonth');
        
        // Elak pertembungan tapisan julat tarikh vs tapisan bulan
        if (source === 'fMonth' && m) {
            if (document.getElementById('dS')) document.getElementById('dS').value = "";
            if (document.getElementById('dE')) document.getElementById('dE').value = "";
            s = ""; e = "";
        } else if ((source === 'dS' || source === 'dE') && (s || e)) {
            if (document.getElementById('fMonth')) document.getElementById('fMonth').value = "";
            m = "";
        }

        // 1. TAPIS DATA UTAMA SISTEM
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
            return (n.length === 0 || n.includes(r.n)) && 
                   (d.length === 0 || d.includes(r.d)) && 
                   (t.length === 0 || t.includes(r.tn)) && 
                   (k.length === 0 || k.includes(r.kt)) && 
                   pestOk && 
                   (!m || (r.t && r.t.startsWith(m))) && 
                   (!s || r.t >= s) && (!e || r.t <= e);
        });

        // 2. KEMASKINI DROPDOWN (Bergantung kepada pilihan sebelumnya)
        if(source === 'n' || !source) { 
            const dataD = AppState.mData.filter(r => n.length === 0 || n.includes(r.n)); 
            this.updateDropdown('selDaerah', [...new Set(dataD.map(x=>x.d).filter(x=>x))].sort(), d, 'd'); 
        }
        if(source === 'd' || source === 'n' || !source) { 
            const dataT = AppState.mData.filter(r => (n.length === 0 || n.includes(r.n)) && (d.length === 0 || d.includes(r.d))); 
            this.updateDropdown('selTanaman', [...new Set(dataT.map(x=>x.tn).filter(x=>x))].sort(), t, 't'); 
        }
        if(source === 't' || source === 'd' || source === 'n' || !source) {
            const dataRest = AppState.mData.filter(r => (n.length === 0 || n.includes(r.n)) && (d.length === 0 || d.includes(r.d)) && (t.length === 0 || t.includes(r.tn)));
            this.updateDropdown('selKategori', [...new Set(dataRest.map(x=>x.kt).filter(x=>x))].sort(), k, 'k');
            
            let allPests = new Set(); 
            dataRest.forEach(r => { 
                try { 
                    let obj = typeof r.p === 'string' ? JSON.parse(r.p) : r.p; 
                    if(obj) Object.keys(obj).forEach(x => allPests.add(x)); 
                } catch(err){} 
            });
            this.updateDropdown('selPerosak', [...allPests].sort(), p, 'p');
        }
        
        // 3. REFRESH DASHBOARD UTAMA
        AppState.pg = 1; 
        DashboardManager.calcUI();

        // 4. REFRESH DASHBOARD SKU (JIKA SEDANG DIBUKA)
        const viewSKU = document.getElementById('view-sku');
        if (viewSKU && viewSKU.style.display !== 'none' && typeof KPIManager !== 'undefined') {
            KPIManager.renderDashboard();
        }
    },

    updateDropdown: function(id, list, curValArray, srcCode) { 
        const menu = document.getElementById('list' + id); 
        if(!menu) {
            const container = document.getElementById('filterDropdownsContainer');
            if(container) {
                const labelMap = { 'selNegeri': 'Negeri', 'selDaerah': 'Daerah', 'selTanaman': 'Tanaman', 'selPerosak': 'Perosak', 'selKategori': 'Kategori' };
                const html = `
                <div class="filter-dropdown-item flex-grow-1">
                    <label class="filter-label text-slate-700 fw-extrabold mb-1">${labelMap[id]}</label>
                    <div class="dropdown d-grid">
                        <button class="btn btn-white border text-start text-truncate dropdown-toggle btn-sm bg-white rounded-3 shadow-2xs py-2 d-flex justify-content-between align-items-center" type="button" id="btn${id}" data-bs-toggle="dropdown" data-bs-auto-close="outside"><span>- Semua -</span></button>
                        <div class="dropdown-menu p-2 shadow-lg rounded-3 border-0 mt-1" style="max-height: 240px; overflow-y: auto; min-width: 220px;" id="list${id}"></div>
                    </div>
                </div>`;
                container.insertAdjacentHTML('beforeend', html);
            }
        }
        
        const menuEl = document.getElementById('list' + id);
        if(!menuEl) return;
        
        menuEl.innerHTML = ''; 
        list.forEach(x => { 
            const isChecked = (curValArray && curValArray.includes(x)) ? 'checked' : '';
            const cleanId = 'chk_' + id + '_' + x.replace(/[^a-zA-Z0-9]/g, '');
            const div = document.createElement('div');
            div.className = 'form-check mb-1';
            div.innerHTML = `<input class="form-check-input chk-${id}" type="checkbox" value="${x}" id="${cleanId}" ${isChecked}>
                             <label class="form-check-label w-100 text-truncate" style="font-size:0.85rem; cursor:pointer;" for="${cleanId}">${x}</label>`;
            
            div.querySelector('input').addEventListener('change', () => {
                FilterManager.updateBtnText(id);
                FilterManager.runFilter(srcCode);
            });
            menuEl.appendChild(div);
        }); 
        this.updateBtnText(id);
    },

    updateBtnText: function(id) {
        const btn = document.getElementById('btn' + id);
        if(!btn) return;
        const checked = Array.from(document.querySelectorAll('.chk-' + id + ':checked')).map(cb => cb.value);
        if (checked.length === 0) { 
            btn.innerHTML = '<span>- Semua -</span>'; 
            btn.classList.remove('fw-extrabold','text-primary','border-primary-subtle'); 
        } else if (checked.length === 1) { 
            btn.innerHTML = `<span class="text-truncate">${checked[0]}</span>`; 
            btn.classList.add('fw-extrabold','text-primary','border-primary-subtle'); 
        } else { 
            btn.innerHTML = `<span>${checked.length} Dipilih</span>`; 
            btn.classList.add('fw-extrabold','text-primary','border-primary-subtle'); 
        }
    },

    fillSel: function(id, arr, srcCode) { 
        this.updateDropdown(id, arr, [], srcCode); 
    },

    resetFilter: function(){ 
        document.querySelectorAll('.form-check-input').forEach(cb => { if(!cb.disabled) cb.checked = false; });
        document.querySelectorAll('input[type=date], input[type=month]').forEach(e => e.value=""); 
        ['selNegeri', 'selDaerah', 'selTanaman', 'selPerosak', 'selKategori'].forEach(id => FilterManager.updateBtnText(id));
        FilterManager.runFilter('n'); 
    }
};
