// ==========================================
// FAIL: js/filter.js
// FUNGSI: Menguruskan Dropdown Menu & Tapisan Data
// ==========================================

const FilterManager = {
    
    // Fungsi bantuan untuk dapatkan nilai kotak tapisan
    v: function(id) { 
        if(id === 'dS' || id === 'dE') { const el = document.getElementById(id); return el ? el.value : ""; }
        const checkboxes = document.querySelectorAll('.chk-' + id + ':checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },

runFilter: function(source) {
        const n = this.v('selNegeri');
        const d = this.v('selDaerah');
        const t = this.v('selTanaman');
        const p = this.v('selPerosak');
        const k = this.v('selKategori');
        const s = this.v('dS');
        const e = this.v('dE');
        
        AppState.fData = AppState.mData.filter(r => { 
            let pestOk = true; 
            if (p.length > 0) {
                pestOk = false;
                if (r.p) {
                    try { 
                        const pestObj = (typeof r.p==='string' ? JSON.parse(r.p) : r.p);
                        pestOk = p.some(selectedPest => pestObj[selectedPest]);
                    } catch(err) {}
                }
            }
            return (n.length===0 || n.includes(r.n)) && 
                   (d.length===0 || d.includes(r.d)) && 
                   (t.length===0 || t.includes(r.tn)) && 
                   (k.length===0 || k.includes(r.kt)) && 
                   pestOk && (!s||r.t>=s) && (!e||r.t<=e);
        });

        if(source === 'n' || !source) { 
            const dataD = AppState.mData.filter(r => n.length===0 || n.includes(r.n)); 
            this.updateDropdown('selDaerah', [...new Set(dataD.map(x=>x.d).filter(x=>x))].sort(), d, 'd'); 
        }
        if(source === 'd' || source === 'n' || !source) { 
            const dataT = AppState.mData.filter(r => (n.length===0 || n.includes(r.n)) && (d.length===0 || d.includes(r.d))); 
            this.updateDropdown('selTanaman', [...new Set(dataT.map(x=>x.tn).filter(x=>x))].sort(), t, 't'); 
        }
        if(source === 't' || source === 'd' || source === 'n' || !source) {
            const dataRest = AppState.mData.filter(r => (n.length===0 || n.includes(r.n)) && (d.length===0 || d.includes(r.d)) && (t.length===0 || t.includes(r.tn)));
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
        
        AppState.pg = 1; 
        DashboardManager.calcUI();

        // ==========================================
        // TAMBAH: UPDATE SKU JIKA TAB SKU SEDANG DIBUKA
        // ==========================================
        const viewSKU = document.getElementById('view-sku');
        if (viewSKU && viewSKU.style.display !== 'none' && typeof KPIManager !== 'undefined') {
            KPIManager.renderDashboard();
        }
    },

    updateDropdown: function(id, list, curValArray, srcCode) { 
        const menu = document.getElementById('list' + id); 
        if(!menu) {
            // Cipta struktur dropdown jika belum ada (dari HTML induk yang bersih)
            const container = document.getElementById('filterDropdownsContainer');
            if(container) {
                const labelMap = { 'selNegeri': 'Negeri', 'selDaerah': 'Daerah', 'selTanaman': 'Tanaman', 'selPerosak': 'Perosak', 'selKategori': 'Kategori' };
                const html = `
                <div class="mb-2">
                    <label class="filter-label">${labelMap[id]}</label>
                    <div class="dropdown d-grid">
                        <button class="btn btn-white border text-start text-truncate dropdown-toggle btn-sm bg-white" type="button" id="btn${id}" data-bs-toggle="dropdown" data-bs-auto-close="outside">- Semua -</button>
                        <div class="dropdown-menu w-100 p-2 shadow-sm" style="max-height: 220px; overflow-y: auto;" id="list${id}"></div>
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
        if (checked.length === 0) { btn.innerText = '- Semua -'; btn.classList.remove('fw-bold','text-primary'); }
        else if (checked.length === 1) { btn.innerText = checked[0]; btn.classList.add('fw-bold','text-primary'); }
        else { btn.innerText = checked.length + ' Dipilih'; btn.classList.add('fw-bold','text-primary'); }
    },

    fillSel: function(id, arr, srcCode) { 
        this.updateDropdown(id, arr, [], srcCode); 
    },

    resetFilter: function(){ 
        document.querySelectorAll('.form-check-input').forEach(cb => { if(!cb.disabled) cb.checked = false; });
        document.querySelectorAll('input[type=date]').forEach(e => e.value=""); 
        ['selNegeri', 'selDaerah', 'selTanaman', 'selPerosak', 'selKategori'].forEach(id => FilterManager.updateBtnText(id));
        FilterManager.runFilter('n'); 
    }
};
