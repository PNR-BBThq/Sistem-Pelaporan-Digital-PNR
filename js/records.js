// ==========================================
// FAIL: js/records.js
// FUNGSI: Menguruskan Master Data, Tugasan, Pengesahan & Borang 
// STATUS: 100% Dioptimasikan & Kalis Ralat JSON Type-Casting
// ==========================================

const STATE_BOUNDS = {
    "JOHOR":             { minLat: 1.2,  maxLat: 2.9,  minLng: 102.4, maxLng: 104.6 },
    "KEDAH":             { minLat: 5.0,  maxLat: 6.6,  minLng: 99.5,  maxLng: 101.2 },
    "KELANTAN":          { minLat: 4.5,  maxLat: 6.3,  minLng: 101.3, maxLng: 102.7 },
    "MELAKA":            { minLat: 2.0,  maxLat: 2.5,  minLng: 101.9, maxLng: 102.6 },
    "NEGERI SEMBILAN":   { minLat: 2.3,  maxLat: 3.2,  minLng: 101.8, maxLng: 102.7 },
    "PAHANG":            { minLat: 2.4,  maxLat: 4.9,  minLng: 101.3, maxLng: 104.3 },
    "PERAK":             { minLat: 3.5,  maxLat: 6.0,  minLng: 100.3, maxLng: 101.8 },
    "PERLIS":            { minLat: 6.2,  maxLat: 6.75, minLng: 100.0, maxLng: 100.4 },
    "PULAU PINANG":      { minLat: 5.1,  maxLat: 5.6,  minLng: 100.1, maxLng: 100.6 },
    "SABAH":             { minLat: 4.0,  maxLat: 7.5,  minLng: 115.0, maxLng: 119.5 },
    "SARAWAK":           { minLat: 0.8,  maxLat: 5.0,  minLng: 109.0, maxLng: 115.6 },
    "SELANGOR":          { minLat: 2.6,  maxLat: 3.9,  minLng: 100.7, maxLng: 102.0 },
    "TERENGGANU":        { minLat: 3.9,  maxLat: 5.9,  minLng: 102.3, maxLng: 103.6 },
    "W.P. KUALA LUMPUR": { minLat: 3.0,  maxLat: 3.25, minLng: 101.6, maxLng: 101.8 },
    "W.P. PUTRAJAYA":    { minLat: 2.85, maxLat: 3.0,  minLng: 101.6, maxLng: 101.75 },
    "W.P. LABUAN":       { minLat: 5.2,  maxLat: 5.4,  minLng: 115.1, maxLng: 115.3 }
};

const DataManager = {
    loadMasterData: async function() {
        try {
            const r = await API.postData('getTanamanList', {});
            let clean = {};
            if (r.data) clean = r.data;
            else if (r.success === undefined && Object.keys(r).length > 0) clean = r; 
            else {
                clean = Object.assign({}, r);
                delete clean.success; delete clean.message;
            }
            AppState.pestMasterData = clean;
        } catch(e) { console.error("Gagal load pest data", e); }
    },

    viewRec: function(idx) {
        const d = AppState.fData[idx]; if (!d) return;
        const cleanImg = (raw) => { if (!raw) return []; let str = String(raw).trim().replace(/[\[\]"'\\]/g, ''); return str.split(',').map(l => l.trim()).filter(l => l.toLowerCase().startsWith('http')); };
        let pestRows = "";
        
        // 🛠️ TAMPAL BOM 1: Kalis Ralat String/Objek bagi Data Perosak
        let parsedPest = typeof d.p === 'string' ? JSON.parse(d.p) : (d.p || {});
        let parsedSev = typeof d.pk === 'string' ? JSON.parse(d.pk) : (d.pk || {});
        
        if (Object.keys(parsedPest).length > 0) { 
            Object.keys(parsedPest).forEach(k => { 
                let luasVal = parseFloat(parsedPest[k]) || 0;
                let luasTanam = parseFloat(d.lt) || 0;
                let pctVal = luasTanam > 0 ? ((luasVal / luasTanam) * 100).toFixed(2) : "0.00";
                let sevVal = parsedSev[k] ? parsedSev[k] : (d.k || 0); 
                let level = parseInt(sevVal) || 0; 
                let badgeColor = level < 3 ? 'success' : (level < 4 ? 'warning' : 'danger'); 
                pestRows += `<tr><td style="font-size:0.85rem" class="text-uppercase">${k}</td><td class="text-center fw-bold">${luasVal.toFixed(2)}</td><td class="text-center small">${pctVal}%</td><td class="text-center"><span class="badge bg-${badgeColor}">T${level}</span></td></tr>`; 
            }); 
        } else { 
            pestRows = `<tr><td colspan="4" class="text-center text-muted small">Tiada Serangan Perosak Dikesan</td></tr>`; 
        }
        
        const imgLinks = cleanImg(d.im);
        let imgHTML = imgLinks.length > 0 ? `<div class="mt-3 pt-2 border-top"><h6 class="fw-bold text-secondary small mb-2 text-uppercase"><i class="bi bi-paperclip me-1"></i> LAMPIRAN GAMBAR</h6><div class="d-flex flex-wrap gap-2">` + imgLinks.map((lnk,i)=>`<a href="${lnk}" target="_blank" class="btn btn-sm btn-outline-primary bg-white shadow-sm text-truncate fw-bold" style="max-width:140px;"><i class="bi bi-image me-1"></i> Gambar ${i+1}</a>`).join('') + `</div></div>` : `<div class="mt-3 pt-2 border-top"><small class="text-muted fst-italic text-uppercase"><i class="bi bi-slash-circle me-1"></i> TIADA GAMBAR</small></div>`;
        
        let adminBtns = "";
        if (AppState.uProf.role === "ADMIN") { 
            adminBtns = `<div class="border-top pt-3 mt-3 d-flex justify-content-between gap-2">
                <button onclick="DataManager.enableEditMode(${d.id})" class="btn btn-outline-primary btn-sm flex-grow-1"><i class="bi bi-pencil-square disguise me-1"></i> KEMASKINI</button>
                <button onclick="DataManager.doDeleteRec(${d.id})" class="btn btn-outline-danger btn-sm flex-grow-1"><i class="bi bi-trash-fill me-1"></i> PADAM</button>
            </div>`; 
        }

        const html = `
        <div class="verify-card bg-white rounded-3 shadow-sm border h-100 position-relative">
            <div class="p-3 border-bottom bg-light d-flex justify-content-between align-items-start">
                <div><div class="fw-bold text-uppercase text-dark">${d.pg}</div><div class="small text-muted fst-italic">${d.em}</div></div>
                <span class="badge bg-success text-white shadow-sm">DISAHKAN</span>
            </div>
            <div class="p-3 pb-0">
                <div id="view_info_${d.id}">
                    <h6 class="fw-bold text-success mb-3 small border-bottom pb-2 text-uppercase"><i class="bi bi-info-circle-fill me-1"></i> LOKASI & TANAMAN</h6>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">TARIKH BANCIAN:</div><div class="col-8 fw-bold text-primary">${Utils.formatDateDisplay(d.t)}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">NEGERI:</div><div class="col-8 fw-bold text-dark">${d.n}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">DAERAH:</div><div class="col-8 fw-bold text-dark">${d.d}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">LOKASI:</div><div class="col-8 fw-bold text-dark">${d.l}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">KOORDINAT:</div><div class="col-8 font-monospace text-muted small">${d.c}</div></div>
                    <hr class="my-2 text-muted opacity-25">
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">KATEGORI TANAMAN:</div><div class="col-8 fw-bold text-dark text-uppercase">${d.kt || "-"}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">TANAMAN:</div><div class="col-8 fw-bold text-success">${d.tn}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">VARIETI:</div><div class="col-8 text-uppercase">${d.vr}</div></div>
                    <div class="row g-2 mb-1" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">UMUR TANAMAN:</div><div class="col-8 text-uppercase">${d.um || "-"}</div></div>
                    <div class="row g-2 mb-3" style="font-size:0.9rem"><div class="col-4 fw-bold text-secondary">LUAS TANAMAN:</div><div class="col-8 text-dark">${d.lt.toFixed(2)} HA</div></div>
                </div>
                <div id="edit_mode_${d.id}" style="display:none;" class="bg-light p-3 rounded border mb-3">
                    <div class="text-center text-muted">Sila gunakan fungsi 'Tugasan Saya' atau Admin panel.</div>
                    <button onclick="DataManager.cancelEdit(${d.id})" class="btn btn-secondary btn-sm w-100">Tutup</button>
                </div>
            </div>
            <div class="px-3" id="view_pest_${d.id}">
                <h6 class="fw-bold text-success mb-2 small text-uppercase"><i class="bi bi-bug-fill me-1"></i> DATA SERANGAN</h6>
                <div class="table-responsive border rounded mb-2"><table class="table table-sm table-striped mb-0" style="font-size:0.8rem"><thead class="table-light"><tr><th>PEROSAK</th><th class="text-center">LUAS SERANGAN(HA)</th><th class="text-center">PERATUS SERANGAN</th><th class="text-center">KETERUKAN SERANGAN</th></tr></thead><tbody>${pestRows}</tbody></table></div>
                <div class="alert alert-warning border-warning mb-0 py-2 px-3 small"><i class="bi bi-lightbulb-fill text-warning me-1"></i> <strong>SYOR:</strong> ${d.s}</div>${imgHTML}
            </div>
            <div class="p-3 mt-auto"><div class="bg-success bg-opacity-10 border border-success rounded p-2 text-center"><small class="text-success fw-bold text-uppercase mb-1 d-block">DISAHKAN OLEH:</small><div class="text-dark small fw-bold">${d.vb}</div></div>${adminBtns}</div>
        </div>`;
        document.getElementById('detailBody').innerHTML = html;
        document.getElementById('modalTitle').innerText = "BUTIRAN REKOD DISAHKAN";
        new bootstrap.Modal(document.getElementById('detailModal')).show();
    },

    enableEditMode: function(id) { 
        document.getElementById(`view_info_${id}`).style.display = 'none'; 
        document.getElementById(`view_pest_${id}`).style.display = 'none'; 
        document.getElementById(`edit_mode_${id}`).style.display = 'block'; 
    },
    
    cancelEdit: function(id) { 
        document.getElementById(`view_info_${id}`).style.display = 'block'; 
        document.getElementById(`view_pest_${id}`).style.display = 'block'; 
        document.getElementById(`edit_mode_${id}`).style.display = 'none'; 
    },
    
    doDeleteRec: async function(rowID) { 
        if(!confirm("Padam rekod ini?")) return; 
        const btn = event.target.closest('button'); 
        btn.innerHTML='...'; btn.disabled=true; 
        const r = await API.postData('deleteEntry', {row:rowID}); 
        alert(r.message); 
        if(r.success) location.reload(); 
    }
};

const VerifyManager = {
    checkPendingCount: async function() { 
        try { 
            if(["ADMIN","PENYELIA"].includes((AppState.uProf.role||"").toUpperCase())) {
                const d = await API.postData('getPending', {state: AppState.uProf.state}); 
                const b = document.getElementById('badgePending'); 
                if(d.rows && d.rows.length > 0) { b.innerText = d.rows.length; b.style.display = "inline-block"; } else { b.style.display = "none"; } 
            }
        } catch(e){ console.error("Error checking pending:", e); } 
    },

    loadPend: async function() { 
        const container = document.getElementById('verifyContainer'); 
        container.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-primary"></div></div>'; 
        try { 
            const d = await API.postData('getPending', {state: AppState.uProf.state}); 
            AppState.currentPendingRows = d.rows || []; 
            if(d.headers) AppState.currentHeaders = d.headers; 
            
            const b = document.getElementById('badgePending');
            b.innerText = AppState.currentPendingRows.length; 
            b.style.display = AppState.currentPendingRows.length ? "inline-block" : "none";

            if(!d.rows || !d.rows.length) { 
                container.innerHTML = '<div class="col-12 text-center p-5 text-muted bg-white rounded border border-dashed"><i class="bi bi-check-circle fs-3 text-success d-block mb-2"></i>Tiada data baru untuk disahkan.</div>'; 
                return; 
            } 
            container.innerHTML = ""; 
            d.rows.forEach(r => TaskManager.renderCard(r, container, 'VERIFY', d.headers)); 
        } catch(e) { 
            console.error(e); container.innerHTML='<div class="col-12 text-center p-5 text-danger">Ralat memuatkan data.</div>'; 
        } 
    },

    subVer: async function(row, act) { 
        let re = ""; 
        if(act==='REJECT'){ re=prompt("Sebab:"); if(!re) return; } 
        else if(!confirm("Sahkan?")) return; 
        
        const r = await API.postData('submitVerify', {row:row, act:act, reason:re, name:AppState.uProf.name}); 
        alert(r.message); 
        if(r.success) { this.loadPend(); this.checkPendingCount(); DashboardManager.initDash(); } 
    },

    approveAll: async function() { 
        if(!confirm("Sahkan SEMUA data yang telah diisi?")) return; 
        
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';
        btn.disabled = true;

        const progBox = document.getElementById('bulkProgress');
        const progBar = document.getElementById('progBar');
        const progText = document.getElementById('progText');
        if(progBox) progBox.style.display = 'block';
        if(progBar) progBar.style.width = '0%';
        if(progText) progText.innerText = '0%';

        const d = await API.postData('getPending', {state: AppState.uProf.state}); 
        
        if(!d.rows || !d.rows.length) {
            btn.innerHTML = originalText; btn.disabled = false;
            if(progBox) progBox.style.display = 'none';
            alert("Tiada data untuk disahkan."); return; 
        } 
        
        let total = d.rows.length;
        let count = 0;

        for (const r of d.rows) { 
            await API.postData('submitVerify', {row: r.row, act: 'APPROVE', reason: 'Bulk', name: AppState.uProf.name}); 
            count++;
            let pct = Math.round((count / total) * 100);
            if(progBar) progBar.style.width = pct + '%';
            if(progText) progText.innerText = pct + '%';
        } 
        
        alert("✅ Selesai! Semua data berjaya disahkan."); 
        btn.innerHTML = originalText; btn.disabled = false;
        if(progBox) progBox.style.display = 'none';
        
        this.loadPend(); DashboardManager.initDash(); this.checkPendingCount();
    }
};

const TaskManager = {
    retainedImagesGlobal: [],
    currentFile: null,
    
    getEditLocation: function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(p) {
                const gpsBox = document.getElementById('fe_coord');
                if (gpsBox) {
                    gpsBox.value = p.coords.latitude.toFixed(5) + ", " + p.coords.longitude.toFixed(5);
                    gpsBox.classList.remove('is-invalid');
                }
            }, function(err) {
                Swal.fire('Gagal GPS', 'Sila hidupkan lokasi peranti anda. ' + err.message, 'error');
            });
        } else {
            Swal.fire('Gagal', 'Pelayar web peranti tidak menyokong Geolocation GPS.', 'error');
        }
    },

    checkTaskCount: async function() {
        try {
            if(!AppState.uProf || !AppState.uProf.name) return;
            const d = await API.postData('getMyTasks', { name: AppState.uProf.name });
            const b = document.getElementById('badgeTask');
            if(b) {
                if(d.rows && d.rows.length > 0) { 
                    b.innerText = d.rows.length; 
                    b.style.display = "inline-block"; 
                } else { 
                    b.style.display = "none"; 
                }
            }
        } catch(e) { console.error("Error task count:", e); }
    },
    loadMyTasks: async function() {
        const container = document.getElementById('taskContainer');
        container.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-primary"></div></div>';
        try {
            const d = await API.postData('getMyTasks', { name: AppState.uProf.name });
            AppState.myTasksData = d.rows || [];
            AppState.currentHeaders = d.headers || []; 
            const b = document.getElementById('badgeTask');
            b.innerText = AppState.myTasksData.length; 
            b.style.display = AppState.myTasksData.length ? "inline-block" : "none";
            
            if (!AppState.myTasksData.length) { 
                container.innerHTML = '<div class="col-12 text-center p-5 text-muted bg-white rounded border border-dashed">Tiada tugasan aktif.</div>'; return; 
            }
            container.innerHTML = ""; 
            AppState.myTasksData.forEach(r => this.renderCard(r, container, 'TASK', AppState.currentHeaders));
        } catch(e) { container.innerHTML = "Ralat memuatkan tugasan."; }
    },

   renderCard: function(r, container, type, headersData) {
        const hList = headersData || AppState.currentHeaders;
        const getV = (key) => { const i = hList.findIndex(h => h.toUpperCase().includes(key.toUpperCase())); return i > -1 ? r.data[i] : ""; };
        
        if (type === 'TASK') {
            const lokasi = getV('LOKASI') || getV('KEBUN');
            const tanaman = getV('NAMA TANAMAN') || getV('TANAMAN');
            const kategori = getV('KATEGORI') || "-";
            const tarikh = Utils.formatDateDisplay(getV('TARIKH') || getV('DATE'));
            const statusRekod = getV('STATUS') || ""; 
            const log = getV('LOG') || "";
            
            let btnAction = ""; let badgeHtml = ""; let cardBorder = "primary"; let bgHeader = "light";

            if (statusRekod.toUpperCase() === 'DRAF') {
                badgeHtml = `<span class="badge bg-secondary">DRAF</span>`; cardBorder = "secondary";
                btnAction = `<button class="btn btn-success w-100 fw-bold btn-sm shadow-sm" onclick="TaskManager.openTaskEdit(${r.row})"><i class="bi bi-pencil-square"></i> SAMBUNG ISI / HANTAR</button>`;
            } else {
                badgeHtml = `<span class="badge bg-danger">DITOLAK</span>`; cardBorder = "danger"; bgHeader = "danger bg-opacity-10";
                let reason = log.includes("DITOLAK") ? log.split("Sebab:").pop() : "Sila semak log.";
                btnAction = `<div class="task-reject-box p-2 mb-2 small"><i class="bi bi-exclamation-triangle-fill"></i> ${reason}</div><button class="btn btn-danger w-100 fw-bold btn-sm" onclick="TaskManager.openTaskEdit(${r.row})">KEMASKINI & HANTAR</button>`;
            }

            container.innerHTML += `
            <div class="col-md-6 col-xl-4">
                <div class="verify-card bg-white rounded-3 shadow-sm border mb-3 h-100 border-${cardBorder}">
                    <div class="p-3 border-bottom bg-${bgHeader} d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-bold text-dark">${lokasi}</div>
                            <div class="small text-muted">${kategori} - ${tanaman}</div>
                            <div class="small text-muted mt-1"><i class="bi bi-calendar-event"></i> ${tarikh}</div>
                        </div>
                        ${badgeHtml}
                    </div>
                    <div class="p-3 mt-auto">
                        ${btnAction}
                    </div>
                </div>
            </div>`;
        } 
        else if (type === 'VERIFY') {
            const tkhHantar = Utils.formatDateDisplay(getV('Timestamp'));
            const tarikhBancian = Utils.formatDateDisplay(getV('Tarikh Bancian') || getV('Tarikh') || getV('Date'));
            const nama = getV('Nama') || getV('Pegawai');
            const email = getV('Email') || "-";
            const negeri = getV('Negeri') || "-";
            const daerah = getV('Daerah') || "-";
            const lokasi = getV('Lokasi') || getV('Kebun') || "-";
            const koordinat = String(getV('Koordinat') || "-");
            const tanaman = getV('Nama Tanaman') || getV('Tanaman') || "-";
            const varieti = getV('Varieti') || "-";
            const umur = getV('Umur') || "-";
            const kategori = getV('Kategori') || "-";
            const luasTanam = getV('Luas Bertanam') || getV('Luas') || "-";
            const syor = getV('Syor') || "-";

            let btnMap = ""; 
            if(koordinat && koordinat.includes(',') && koordinat.length > 5) { 
                const cleanCoord = koordinat.trim().replace(/\s/g, ''); 
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=$$${cleanCoord}`; 
                btnMap = `<a href="${mapUrl}" target="_blank" class="btn btn-sm btn-outline-primary border-0 py-0 px-1 ms-2" title="Lihat di Google Maps" style="line-height:1;"><i class="bi bi-geo-alt-fill"></i></a>`; 
            }

            let pestRows = ""; 
            try { 
                // 🛠️ TAMPAL BOM 2: Kalis Ralat JSON.parse untuk Objek Sedia Ada (Modul Pengesahan)
                const getObj = (key) => {
                    const raw = getV(key);
                    if (!raw) return {};
                    return typeof raw === 'string' ? JSON.parse(raw) : raw;
                };

                const lsObj = getObj('Luas Serangan'); 
                const pctObj = getObj('Peratus'); 
                const kObj = getObj('Keterukan'); 
                
                if(Object.keys(lsObj).length > 0) { 
                    Object.keys(lsObj).forEach(k => { 
                        let level = kObj[k] || 0; 
                        let badgeColor = level < 3 ? 'success' : (level < 4 ? 'warning' : 'danger'); 
                        pestRows += `<tr><td class="text-start text-uppercase" style="font-size:0.8rem; vertical-align:middle;">${k}</td><td class="text-center fw-bold" style="vertical-align:middle;">${lsObj[k]}</td><td class="text-center small" style="vertical-align:middle;">${pctObj[k]||0}%</td><td class="text-center" style="vertical-align:middle;"><span class="badge bg-${badgeColor}">T${level}</span></td></tr>`; 
                    }); 
                } else { 
                    pestRows = `<tr><td colspan="4" class="text-center text-muted fst-italic small">Tiada Serangan Perosak Dikesan</td></tr>`; 
                } 
            } catch(e) { pestRows = `<tr><td colspan="4" class="text-center text-muted small">Ralat Data</td></tr>`; } 

            const rawImg = getV('IMAGE LINKS (COMMA SEPARATED)') || getV('Gambar') || getV('Image') || getV('Foto'); 
            const imgLinks = (rawImg||"").split(',').map(l => l.trim()).filter(l => l.toLowerCase().startsWith('http')); 
            
            let imgHTML = imgLinks.length > 0 ? `<div class="mt-3 pt-2 border-top"><h6 class="fw-bold text-secondary small mb-2 text-uppercase"><i class="bi bi-images me-1"></i> LAMPIRAN GAMBAR (${imgLinks.length})</h6><div class="d-flex flex-wrap gap-2">` + imgLinks.map((lnk, i) => {
                const idMatch = lnk.match(/[-\w]{25,}/);
                const viewLink = idMatch ? `https://drive.google.com/file/d/${idMatch[0]}/view?usp=sharing` : lnk;
                return `<a href="${viewLink}" target="_blank" class="btn btn-sm btn-outline-primary bg-white shadow-sm text-truncate fw-bold" style="max-width: 140px; font-size:0.75rem"><i class="bi bi-eye me-1"></i> Gambar ${i+1}</a>`;
            }).join('') + `</div></div>` : `<div class="mt-3 pt-2 border-top"><small class="text-muted fst-italic small text-uppercase"><i class="bi bi-slash-circle me-1"></i> TIADA GAMBAR</small></div>`; 

            container.innerHTML += `
            <div class="col-md-6 col-xl-4">
                <div class="verify-card bg-white rounded-3 shadow-sm border mb-3 h-100 d-flex flex-column">
                    <div class="p-3 border-bottom bg-light d-flex justify-content-between align-items-start">
                        <div style="overflow:hidden;"><div class="small text-muted mb-1"><i class="bi bi-clock me-1"></i> Tarikh Hantar: ${tkhHantar}</div><div class="fw-bold text-uppercase text-dark text-truncate">${nama}</div><div class="small text-muted fst-italic text-truncate">${email}</div></div>
                        <span class="badge bg-warning text-dark shadow-sm flex-shrink-0 ms-2">BARU</span>
                    </div>
                    <div class="p-3 flex-grow-1">
                        <div class="mb-4">
                            <h6 class="fw-bold text-success mb-3 small border-bottom pb-2 text-uppercase"><i class="bi bi-info-circle-fill me-1"></i> LOKASI & TANAMAN</h6>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">TARIKH BANCIAN:</div><div class="col-8 fw-bold text-primary">${tarikhBancian}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">NEGERI:</div><div class="col-8 fw-bold text-dark">${negeri}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">DAERAH:</div><div class="col-8 fw-bold text-dark">${daerah}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">LOKASI:</div><div class="col-8 fw-bold text-dark text-break">${lokasi}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">KOORDINAT:</div><div class="col-8 font-monospace text-muted small d-flex align-items-center"><span>${koordinat}</span>${btnMap}</div></div>
                            <hr class="my-2 text-muted opacity-25">
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">KATEGORI TANAMAN:</div><div class="col-8 fw-bold text-dark text-uppercase">${kategori}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">TANAMAN:</div><div class="col-8 fw-bold text-success text-uppercase">${tanaman}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">VARIETI:</div><div class="col-8 text-uppercase">${varieti}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">UMUR TANAMAN:</div><div class="col-8 text-uppercase">${umur}</div></div>
                            <div class="row g-2 mb-1" style="font-size:0.85rem"><div class="col-4 fw-bold text-secondary text-uppercase">LUAS TANAMAN:</div><div class="col-8 text-dark fw-bold">${luasTanam} HA</div></div>
                        </div>
                        <div>
                            <h6 class="fw-bold text-danger mb-2 small border-bottom pb-1 text-uppercase"><i class="bi bi-bug-fill me-1"></i> DATA SERANGAN</h6>
                            <div class="table-responsive border rounded bg-white"><table class="table table-sm table-striped mb-0" style="font-size:0.75rem"><thead class="table-light"><tr><th class="text-start ps-2 text-uppercase">PEROSAK DIKESAN</th><th class="text-center text-wrap text-uppercase">LUAS SERANGAN (HA)</th><th class="text-center text-wrap text-uppercase">PERATUS SERANGAN</th><th class="text-center text-wrap text-uppercase">KETERUKAN SERANGAN</th></tr></thead><tbody>${pestRows}</tbody></table></div>
                            ${imgHTML}
                        </div>
                    </div>
                    <div class="p-3 mt-auto border-top">
                        <div class="alert alert-warning border-warning mb-3 py-2 px-3 small d-flex align-items-start"><i class="bi bi-lightbulb-fill text-warning me-2 mt-1"></i> <div><strong class="text-uppercase d-block mb-1">SYOR KAWALAN:</strong><span class="text-dark">${syor}</span></div></div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-danger flex-grow-1 fw-bold text-uppercase btn-sm py-2" onclick="VerifyManager.subVer(${r.row},'REJECT')"><i class="bi bi-x-lg me-1"></i> TOLAK</button>
                            <button class="btn btn-success flex-grow-1 fw-bold shadow-sm text-uppercase btn-sm py-2" onclick="VerifyManager.subVer(${r.row},'APPROVE')"><i class="bi bi-check-lg me-1"></i> SAHKAN</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },

    openTaskEdit: async function(rowId) {
        const task = AppState.myTasksData.find(t => t.row === rowId);
        if(!task) { alert("Data tidak dijumpai."); return; }
        this.renderEditForm(task.row, task.data);
    },

    updateDistricts: function(srcId, targetId) {
        const state = document.getElementById(srcId).value;
        const target = document.getElementById(targetId);
        target.innerHTML = '<option value="">- Pilih -</option>';
        if(state && DISTRICT_DATA[state]) {
            DISTRICT_DATA[state].forEach(d => { let opt = document.createElement('option'); opt.value=d; opt.innerText=d; target.appendChild(opt); });
        }
    },

    updateTanamanList: function() {
        const kat = document.getElementById('fe_kategori').value;
        const el = document.getElementById('fe_tanaman');
        el.innerHTML = '<option value="">- Pilih -</option>';
        if(kat && AppState.pestMasterData[kat]) {
            Object.keys(AppState.pestMasterData[kat]).sort().forEach(t => { let opt = document.createElement('option'); opt.value=t; opt.innerText=t; el.appendChild(opt); });
        }
    },

    getPestOptionsHTML: function(selectedValue) {
        const kat = document.getElementById('fe_kategori').value;
        const tan = document.getElementById('fe_tanaman').value;
        let pests = [];
        if(kat && tan && AppState.pestMasterData[kat] && AppState.pestMasterData[kat][tan]) { 
            pests = AppState.pestMasterData[kat][tan]; 
        }
        let html = ''; 
        pests.forEach(p => { html += `<option value="${p}">`; });
        return html;
    },

    updatePestRowsOnCropChange: function() {
        document.querySelectorAll('.p-name').forEach(input => {
            const datalist = input.nextElementSibling; 
            if(datalist && datalist.tagName === 'DATALIST') {
                datalist.innerHTML = this.getPestOptionsHTML(input.value);
            }
        });
    },

    setDropdownValue: function(el, val) {
        if(!val) return;
        for(let i=0; i<el.options.length; i++) { 
            if(el.options[i].value.toUpperCase() === String(val).toUpperCase()) { el.selectedIndex = i; return; } 
        }
        let opt = document.createElement('option'); opt.value = val; opt.innerText = val + " (Data Asal)"; opt.selected = true; el.appendChild(opt);
    },

    addPestRow: function(name="", area="", sev="") {
        const tbody = document.querySelector('#fe_pestTable tbody');
        const tr = document.createElement('tr');
        const uniqueId = 'dl_pest_' + Math.floor(Math.random() * 10000); 
        const pestOptions = this.getPestOptionsHTML(name);
        
        tr.innerHTML = `
            <td>
                <input type="text" class="form-control form-control-sm p-name" list="${uniqueId}" value="${name}" placeholder="Pilih/Taip...">
                <datalist id="${uniqueId}">${pestOptions}</datalist>
            </td>
            <td><input type="number" class="form-control form-control-sm p-area" value="${area}" step="0.01" min="0"></td>
            <td>
                <select class="form-select form-select-sm p-sev">
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                </select>
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-link text-danger p-0" onclick="this.closest('tr').remove()"><i class="bi bi-x-circle"></i></button>
            </td>`;
            
        if(sev) tr.querySelector('.p-sev').value = sev;
        tbody.appendChild(tr);
    },

    renderEditImages: function(imgString) {
        const container = document.getElementById('edit_image_preview');
        container.innerHTML = '';
        this.retainedImagesGlobal = [];

        if (imgString && imgString.trim() !== "" && imgString !== "-") {
            const links = imgString.split(',').map(s => s.trim());
            links.forEach((link, index) => {
                if(link) {
                    this.retainedImagesGlobal.push(link);
                    let imgSrc = link; 
                    const matchId = link.match(/[-\w]{25,}/); 
                    if (matchId && matchId[0]) {
                        imgSrc = `https://drive.google.com/thumbnail?id=${matchId[0]}&sz=w150`;
                    }
                    const div = document.createElement('div');
                    div.className = "position-relative";
                    div.style = "width: 75px; height: 75px; border: 1px solid #ccc; border-radius: 5px; overflow: hidden;";
                    div.innerHTML = `
                        <a href="${link}" target="_blank"><img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;"></a>
                        <button type="button" class="btn btn-danger position-absolute top-0 end-0 p-0" 
                                style="width: 22px; height: 22px; line-height: 1; font-size:12px; font-weight:bold; border-radius:0; border-bottom-left-radius:5px;" 
                                onclick="TaskManager.removeRetainedImage(${index}, this)">X</button>
                    `;
                    container.appendChild(div);
                }
            });
        }
    },

    removeRetainedImage: function(index, btnElement) {
        this.retainedImagesGlobal[index] = null; 
        btnElement.parentElement.remove(); 
    },

    renderEditForm: function(rowID, rowData) {
        this.currentFile = null;
        const d = rowData;
        const getIdx = (key) => { if(!AppState.currentHeaders || AppState.currentHeaders.length === 0) return -1; return AppState.currentHeaders.findIndex(h => h.toUpperCase().includes(key.toUpperCase())); };
        const getV = (key) => { const i = getIdx(key); return i > -1 ? d[i] : ""; };

        const valCaption = getV('CAPTION') || getV('TAJUK') || "";
        const savedNegeri = getV('NEGERI');
        const savedDaerah = getV('DAERAH');
        const savedKat = getV('KATEGORI');
        const savedTan = getV('NAMA TANAMAN') || getV('TANAMAN');
        const savedImg = getV('IMAGE LINKS (COMMA SEPARATED)') || getV('GAMBAR') || getV('IMAGE') || getV('FOTO') || "";
        
        let html = `
        <div id="fullEditForm">
            <input type="hidden" id="fe_row" value="${rowID}">
            <h6 class="text-primary border-bottom pb-2">A. Lokasi</h6>
            <div class="row g-2 mb-2">
                <div class="col-6"><label class="small fw-bold">Negeri</label><select id="fe_negeri" class="form-select form-select-sm" onchange="TaskManager.updateDistricts('fe_negeri','fe_daerah')"><option value="">- Pilih -</option>${Object.keys(DISTRICT_DATA).sort().map(n => `<option value="${n}">${n}</option>`).join('')}</select></div>
                <div class="col-6"><label class="small fw-bold">Daerah</label><select id="fe_daerah" class="form-select form-select-sm"></select></div>
            </div>
            <div class="mb-2"><label class="small fw-bold">Lokasi/Kebun</label><input type="text" id="fe_lokasi" class="form-control form-control-sm" value="${getV('LOKASI')}"></div>
            <div class="mb-2">
                <label class="small fw-bold">Koordinat GPS (WGS84)</label>
                <div class="input-group">
                    <input type="text" id="fe_coord" class="form-control form-control-sm" value="${getV('KOORDINAT')}" placeholder="Contoh: 4.2105, 101.9758">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="TaskManager.getEditLocation()"><i class="bi bi-geo-alt-fill"></i> Lokasi Saya</button>
                </div>
            </div>
            <div class="row g-2 mb-2">
                <div class="col-6"><label class="small fw-bold">Tarikh</label><input type="date" id="fe_tarikh" class="form-control form-control-sm" value="${(function(dStr){if(!dStr)return"";const x=new Date(dStr);return isNaN(x)?"":x.toISOString().split('T')[0];})(getV('TARIKH'))}"></div>
                <div class="col-6"><label class="small fw-bold">Pegawai</label><input type="text" id="fe_pegawai" class="form-control form-control-sm" readonly value="${getV('NAMA')||getV('PEGAWAI')}"></div>
            </div>
            
            <h6 class="text-primary border-bottom pb-2 mt-3">B. Tanaman</h6>
            <div class="row g-2 mb-2">
                <div class="col-6"><label class="small fw-bold">Kategori</label><select id="fe_kategori" class="form-select form-select-sm" onchange="TaskManager.updateTanamanList()"><option value="">- Pilih -</option>${Object.keys(AppState.pestMasterData).sort().map(k => `<option value="${k}">${k}</option>`).join('')}</select></div>
                <div class="col-6"><label class="small fw-bold">Tanaman</label><select id="fe_tanaman" class="form-select form-select-sm" onchange="TaskManager.updatePestRowsOnCropChange()"><option value="">- Pilih Kategori Dulu -</option></select></div>
            </div>
            <div class="row g-2 mb-2">
                <div class="col-6"><label class="small fw-bold">Varieti</label><input type="text" id="fe_varieti" class="form-control form-control-sm" value="${getV('VARIETI')}"></div>
                <div class="col-6"><label class="small fw-bold">Umur</label><input type="text" id="fe_umur" class="form-control form-control-sm" value="${getV('UMUR')}"></div>
            </div>
            <div class="mb-2"><label class="small fw-bold">Luas Tanam (Ha)</label><input type="number" id="fe_luasT" class="form-control form-control-sm" value="${getV('LUAS')}"></div>
            
            <h6 class="text-primary border-bottom pb-2 mt-3">C. Data Serangan</h6>
            <table class="table table-sm table-bordered" id="fe_pestTable">
                <thead class="table-light"><tr><th>Perosak</th><th width="70">Luas(Ha)</th><th width="70">Tahap</th><th></th></tr></thead>
                <tbody></tbody>
            </table>
            <button type="button" class="btn btn-outline-primary btn-sm w-100 mb-3" onclick="TaskManager.addPestRow()">+ Tambah Perosak</button>
            
            <h6 class="text-primary border-bottom pb-2 mt-3">D. Gambar & Kapsyen</h6>
            <div class="mb-3 p-3 bg-white border rounded">
                <label class="form-label fw-bold small">Gambar Sedia Ada</label>
                <div id="edit_image_preview" class="d-flex flex-wrap gap-2 mb-3"></div>
                <label class="small fw-bold mb-1">Tambah Gambar Baru</label>
                <input type="file" id="fe_img" class="form-control form-control-sm" accept="image/*" multiple>
                <label class="small fw-bold mb-1 mt-3">Kapsyen</label>
                <input type="text" id="fe_caption" class="form-control form-control-sm mb-2" value="${valCaption}">
            </div>
            <div class="mb-3"><label class="small fw-bold text-success">Syor Kawalan</label><textarea id="fe_syor" class="form-control" rows="3">${getV('SYOR')}</textarea></div>
            <button class="btn btn-success w-100 py-2 fw-bold" onclick="TaskManager.saveFullEdit()">SIMPAN PERUBAHAN</button>
        </div>`;

        document.getElementById('detailBody').innerHTML = html;
        
        this.setDropdownValue(document.getElementById('fe_negeri'), savedNegeri); this.updateDistricts('fe_negeri','fe_daerah'); 
        this.setDropdownValue(document.getElementById('fe_daerah'), savedDaerah);
        this.setDropdownValue(document.getElementById('fe_kategori'), savedKat); this.updateTanamanList();
        this.setDropdownValue(document.getElementById('fe_tanaman'), savedTan);

        let luasObj = {}, sevObj = {};
        try { luasObj = JSON.parse(getV('LUAS SERANGAN')||"{}"); } catch(e){}
        try { sevObj = JSON.parse(getV('KETERUKAN')||"{}"); } catch(e){}
        const pests = Object.keys(luasObj);
        const pestManual = getV('PEROSAK'); 
        
        if(pests.length > 0) { pests.forEach(p => this.addPestRow(p, luasObj[p], sevObj[p])); } 
        else if (pestManual) { this.addPestRow(pestManual, getV('LUAS SERANGAN'), getV('KETERUKAN')); } 
        else { this.addPestRow(); }
        
        this.renderEditImages(savedImg); 
        document.getElementById('modalTitle').innerText = "KEMASKINI DATA";
        new bootstrap.Modal(document.getElementById('detailModal')).show();
    },

    saveFullEdit: async function() {
        if(!confirm("Hantar kemaskini?")) return;
        
        const btn = event.target || document.querySelector('#fullEditForm button.btn-success'); 
        
        const rowID = document.getElementById('fe_row').value;
        const captionVal = document.getElementById('fe_caption').value.trim();
        const luasT = parseFloat(document.getElementById('fe_luasT').value) || 0;
        const coordInput = document.getElementById('fe_coord');
        const coordVal = coordInput ? coordInput.value.trim() : "";
        const feNegeri = document.getElementById('fe_negeri').value;

        if (!coordVal) {
            Swal.fire('Ralat GPS', 'Sila dapatkan atau isi koordinat GPS terlebih dahulu.', 'warning');
            if(coordInput) coordInput.classList.add('is-invalid');
            return;
        }
        var regexKetat = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
        if (!regexKetat.test(coordVal)) {
            Swal.fire('Format GPS Tidak Sah', 'Sila pastikan koordinat mempunyai Latitud dan Longitud yang dipisahkan dengan koma (,).<br><br>Contoh yang betul: <b>3.1234, 101.5678</b>', 'warning');
            if(coordInput) coordInput.classList.add('is-invalid');
            return;
        }

        if (feNegeri && STATE_BOUNDS[feNegeri]) {
            var bounds = STATE_BOUNDS[feNegeri];
            var parts = coordVal.split(',');
            var lat = parseFloat(parts[0].trim());
            var lng = parseFloat(parts[1].trim());
            var isWithinBounds = (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng);

            if (!isWithinBounds) {
                if(coordInput) coordInput.classList.add('is-invalid');
                Swal.fire({
                    icon: 'error',
                    title: '⚠️ Koordinat Di Luar Kawasan!',
                    html: 'Koordinat <b>' + coordVal + '</b> berada <b>LUAR</b> daripada sempadan negeri <b>' + feNegeri + '</b>.<br><br>Sila pastikan kedudukan GPS adalah tepat.',
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: 'Semak Semula'
                });
                return;
            }
        }
        if(coordInput) coordInput.classList.remove('is-invalid');

        if (luasT <= 0) {
            Swal.fire('Ralat Validasi', 'Luas bertanam (Ha) mestilah nilai positif yang lebih besar daripada sifar (0)!', 'warning');
            return;
        }

        const luasS = {}, sevS = {}, pctS = {};
        let names = [];
        let adaRalatValidasi = false;
        let mesejRalat = "";
        const inputLuasTanam = document.getElementById('fe_luasT');

        document.querySelectorAll('#fe_pestTable tbody tr').forEach(tr => {
            const n = tr.querySelector('.p-name').value.toUpperCase().trim();
            const areaInput = tr.querySelector('.p-area');
            const a = areaInput ? parseFloat(areaInput.value) : 0;
            const s = tr.querySelector('.p-sev').value;
            
            if(n) { 
                if (isNaN(a) || a < 0) {
                    adaRalatValidasi = true;
                    mesejRalat = `Luas serangan bagi perosak <b>${n}</b> tidak boleh bernilai negatif atau dibiarkan kosong!`;
                    if(areaInput) areaInput.classList.add('is-invalid');
                }
                else if (a > luasT) {
                    adaRalatValidasi = true;
                    mesejRalat = `Luas serangan bagi perosak <b>${n}</b> (${a} Ha) tidak boleh melebihi luas tanaman keseluruhan (${luasT} Ha)!`;
                    if(areaInput) areaInput.classList.add('is-invalid');
                    if(inputLuasTanam) inputLuasTanam.classList.add('is-invalid');
                } else {
                    if(areaInput) areaInput.classList.remove('is-invalid');
                }

                luasS[n] = a; 
                sevS[n] = s; 
                // 🛠️ TAMPAL BOM 3: Paksa output Number dengan parseFloat supaya tidak sumbang dengan output string ".toFixed(2)"
                pctS[n] = luasT > 0 ? parseFloat(((a / luasT) * 100).toFixed(2)) : 0; 
                names.push(n);
            }
        });

        if (adaRalatValidasi) {
            Swal.fire('Ralat Struktur Data', mesejRalat, 'error');
            return;
        }

        if (btn) {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...'; 
            btn.disabled = true;
        }

        const finalRetainedImages = this.retainedImagesGlobal ? this.retainedImagesGlobal.filter(link => link !== null) : [];
        const fileInput = document.getElementById('fe_img');
        const files = fileInput ? fileInput.files : [];
        let newImagesArray = [];

        if (files.length > 0) {
            Swal.fire({ title: 'Memproses Gambar...', html: 'Sila tunggu sebentar...', showConfirmButton: false, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const readPromises = Array.from(files).map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : ".jpg"; 
                        resolve({ imgName: captionVal ? (captionVal + ext) : file.name, imgType: file.type, imgData: e.target.result.split(',')[1] });
                    };
                    reader.readAsDataURL(file);
                });
            });
            newImagesArray = await Promise.all(readPromises);
        } else {
            Swal.fire({ title: 'Menghantar Data...', showConfirmButton: false, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        }

        const payload = {
            action: 'updateEntry', 
            row: rowID, 
            syor: document.getElementById('fe_syor').value,
            retainedImages: finalRetainedImages, 
            newImages: newImagesArray,

            tarikhBancian: document.getElementById('fe_tarikh').value,
            namaPegawai: document.getElementById('fe_pegawai').value,
            negeri: document.getElementById('fe_negeri').value,
            daerah: document.getElementById('fe_daerah').value,
            lokasi: document.getElementById('fe_lokasi').value,
            koordinat: coordVal,
            kategori: document.getElementById('fe_kategori').value,
            namaTanaman: document.getElementById('fe_tanaman').value,
            varieti: document.getElementById('fe_varieti').value,
            umurTanaman: document.getElementById('fe_umur').value,
            luasBertanam: luasT,
            senaraiPerosak: names.join(', '),
            luasSerangan: luasS,
            peratusSerangan: pctS,
            keterukan: sevS,
            captionGambar: captionVal,

            tarikh: document.getElementById('fe_tarikh').value,
            pegawai: document.getElementById('fe_pegawai').value,
            coord: coordVal,
            tanaman: document.getElementById('fe_tanaman').value,
            umurT: document.getElementById('fe_umur').value,
            luasT: luasT,
            luasS: luasS,
            peratus: pctS,
            name: AppState.uProf.name,
            caption: captionVal
        };

        try {
            const r = await API.postData('updateEntry', payload); 
            Swal.close(); 
            
            alert("✅ Berjaya!"); 
            
            if(r.success || r.status === 'success') {
                bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
                if(document.getElementById('view-tasks').style.display !== 'none') this.loadMyTasks(); 
                else if(document.getElementById('view-verify').style.display !== 'none') VerifyManager.loadPend(); 
                else DashboardManager.initDash();
                VerifyManager.checkPendingCount();
            } else { 
                if (btn) { btn.innerHTML = "SIMPAN PERUBAHAN"; btn.disabled = false; }
            }
        } catch(err) {
            Swal.close(); alert("❌ Gagal berhubung dengan pelayan.");
            if (btn) { btn.innerHTML = "SIMPAN PERUBAHAN"; btn.disabled = false; }
        }
    }
};

// Pasangkan Butang Verify
document.addEventListener("DOMContentLoaded", () => {
    const btnApproveAll = document.getElementById('btnApproveAll');
    if(btnApproveAll) btnApproveAll.addEventListener('click', () => VerifyManager.approveAll());
    
    const btnRefreshVerify = document.getElementById('btnRefreshVerify');
    if(btnRefreshVerify) btnRefreshVerify.addEventListener('click', () => VerifyManager.loadPend());

    const btnRefreshTasks = document.getElementById('btnRefreshTasks');
    if(btnRefreshTasks) btnRefreshTasks.addEventListener('click', () => TaskManager.loadMyTasks());
});
