// ==========================================
// FAIL: js/auth.js
// FUNGSI: Pengurusan Log Masuk, Daftar, Sesi, dan Sekuriti
// ==========================================

const AuthManager = {

    doLogin: async function() {
        const u = document.getElementById('uid').value; 
        const p = document.getElementById('pwd').value; 
        const btn = document.getElementById('btnLogin'); 
        const msg = document.getElementById('loginMsg');
        
        if(!u || !p) { msg.innerText = "Sila isi ID dan Kata Laluan"; return; }
        
        btn.disabled = true; 
        btn.innerText = "Memproses...";
        
        const r = await API.postData('login', {u, p});
        
        if(r.success) {
            const sessionData = { uProf: r, userToken: r.token, currentUserID: u };
            localStorage.setItem('pnr_session', JSON.stringify(sessionData));
            AuthManager.applyLogin(r, r.token, u);
        } else { 
            msg.innerText = r.message; 
            btn.disabled = false; 
            btn.innerText = "MASUK"; 
        }
    },

    applyLogin: function(r, token, uid) {
        // Set ke dalam Global State
        AppState.uProf = r; 
        AppState.userToken = token; 
        AppState.currentUserID = uid;
        
        document.getElementById('uDisp').innerText = r.name; 
        document.getElementById('loginOverlay').style.display = 'none';
        
        // Logik Paparan Navigasi berdasarkan Role
        const role = (r.role || "").toUpperCase();
        if(["ADMIN","PENYELIA"].includes(role)) { 
            document.getElementById('navVerify').style.display = "flex"; 
            if(document.getElementById('mobNavVerify')) document.getElementById('mobNavVerify').style.display = "flex";
            // DashboardManager.checkPendingCount(); // Akan dipanggil nanti bila fail kpi/dashboard siap
        } else {
            // Untuk staff biasa, paparkan butang tugas di phone
            if(document.getElementById('mobNavTasks')) document.getElementById('mobNavTasks').style.display = "flex";
        }
        
        if(role === "ADMIN") {
            document.getElementById('navUsers').style.display = "flex";
        }
        
        document.getElementById('navTasks').style.display = "flex";
        
        // Panggil fungsi-fungsi init dari modul lain (Akan diaktifkan selepas semua fail JS siap)
        if (typeof DataManager !== 'undefined') DataManager.loadMasterData(); 
        if (typeof TaskManager !== 'undefined') TaskManager.loadMyTasks();
        if (typeof DashboardManager !== 'undefined') DashboardManager.initDash();
    },

    checkSession: async function() {
        const saved = localStorage.getItem('pnr_session');
        if (saved) {
            try {
                const s = JSON.parse(saved);
                if (s.uProf && s.userToken) {
                    AuthManager.applyLogin(s.uProf, s.userToken, s.currentUserID);
                    
                    // Hantar log ke server jika ada internet
                    if (navigator.onLine) {
                        API.postData('logSession', { name: s.uProf.name, role: s.uProf.role }).catch(e=>{});
                    } else {
                        console.log("Offline Login: Menggunakan sesi simpanan.");
                        const summary = document.getElementById('smartSummary');
                        if(summary) summary.innerHTML = `<div class="alert alert-warning mb-0"><i class="bi bi-wifi-off"></i> Mod Offline: Anda sedang menggunakan data simpanan.</div>`;
                    }
                }
            } catch (e) {
                console.error("Session rosak", e);
            }
        }
    },

    doLogout: function() { 
        localStorage.removeItem('pnr_session'); 
        location.reload(); 
    },

  toggleDaftar: async function() {
        // Ambil nilai dari borang HTML
        const nama = document.getElementById('reg-nama').value.trim();
        const ic = document.getElementById('reg-ic').value.trim();
        const jawatan = document.getElementById('reg-jawatan').value.trim();
        const negeri = document.getElementById('reg-negeri').value;
        const uid = document.getElementById('reg-uid').value.trim();
        const pwd = document.getElementById('reg-pwd').value.trim();

        if(!nama || !ic || !jawatan || !negeri || !uid || !pwd) {
            Swal.fire('Maklumat Tidak Lengkap', 'Sila isi SEMUA maklumat yang diwajibkan!', 'warning');
            return;
        }

        const formValues = { 
            nama: nama.toUpperCase(), ic: ic, jawatan: jawatan.toUpperCase(), 
            negeri: negeri, uid: uid.toLowerCase(), pwd: pwd,
            role: "STAF", status: "MENUNGGU", catatan: "Didaftar melalui Web PNR"
        };

        Swal.fire({ title: 'Menghantar Pendaftaran...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
        const r = await API.postData('registerUser', formValues);
        
        if (r.success) {
            Swal.fire({ icon: 'success', title: 'Berjaya!', text: r.message, confirmButtonColor: '#198754' }).then(() => {
                // Kembali ke paparan log masuk
                document.getElementById('formDaftar').style.display = 'none';
                document.getElementById('formLogin').style.display = 'block';
                // Kosongkan form
                ['reg-nama','reg-ic','reg-jawatan','reg-negeri','reg-uid','reg-pwd'].forEach(id => document.getElementById(id).value = '');
            });
        } else {
            Swal.fire('Gagal Mendaftar', r.message, 'error');
        }
    },
    
    lupaKatalaluan: async function() {
        const { value: formValues } = await Swal.fire({
            title: 'Lupa Akses Log Masuk?',
            html: `
                <div class="text-start mt-3">
                    <label class="small fw-bold">Nama Penuh</label>
                    <input id="swal-nama" class="form-control mb-3 text-uppercase" placeholder="Sama seperti dalam sistem">
                    <label class="small fw-bold">No. K/P (Tanpa Sengkang)</label>
                    <input id="swal-ic" type="number" class="form-control" placeholder="Cth: 900101011234">
                </div>
            `,
            focusConfirm: false, showCancelButton: true, confirmButtonText: 'Semak Data', cancelButtonText: 'Batal',
            preConfirm: () => {
                const nama = document.getElementById('swal-nama').value.trim();
                const ic = document.getElementById('swal-ic').value.trim();
                if(!nama || !ic) { Swal.showValidationMessage('Sila isi kedua-dua maklumat!'); return false; }
                return { nama, ic };
            }
        });

        if (formValues) {
            Swal.fire({ title: 'Menyemak Data...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
            const r = await API.postData('verifyForgotPwd', formValues);

            if (r.success) {
                const { value: updateValues } = await Swal.fire({
                    title: 'Rekod Dijumpai!',
                    html: `
                        <div class="alert alert-success small mb-3">Kekalkan atau tukar kata laluan baru di sini.</div>
                        <div class="text-start">
                            <label class="small fw-bold text-success">Username</label>
                            <input id="upd-uid" class="form-control mb-3" value="${r.uid}">
                            <label class="small fw-bold text-success">Kata Laluan</label>
                            <input id="upd-pwd" class="form-control" value="${r.pwd}">
                        </div>
                    `,
                    showCancelButton: true, confirmButtonText: '<i class="bi bi-save"></i> Simpan & Log Masuk', cancelButtonText: 'Tutup',
                    preConfirm: () => {
                        const uid = document.getElementById('upd-uid').value.trim();
                        const pwd = document.getElementById('upd-pwd').value.trim();
                        if(!uid || !pwd) { Swal.showValidationMessage('Tidak boleh kosong!'); return false; }
                        return { uid, pwd, row: r.row };
                    }
                });

                if (updateValues) {
                    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
                    const u = await API.postData('updateMyAccess', updateValues);
                    if (u.success) {
                        Swal.fire('Berjaya!', 'Akses telah dikemaskini.', 'success');
                        document.getElementById('uid').value = updateValues.uid;
                        document.getElementById('pwd').value = updateValues.pwd;
                    } else { Swal.fire('Ralat', u.message, 'error'); }
                }
            } else { Swal.fire('Tidak Dijumpai', r.message, 'error'); }
        }
    }
};
