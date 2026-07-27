// ==========================================
// FAIL: js/users.js
// FUNGSI: Pengurusan Pengguna (Admin Sahaja)
// ==========================================

const UserManager = {
    allUsersData: [],

    loadUsers: async function() {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5"><div class="spinner-border text-primary"></div></td></tr>';
        try {
            const d = await API.postData('getUserList', {});
            if(d.success) {
                this.allUsersData = d.users || [];
                this.renderUsers(this.allUsersData);
            } else { 
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${d.message}</td></tr>`; 
            }
        } catch(e) { 
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Ralat memuatkan senarai pengguna.</td></tr>'; 
        }
    },

    renderUsers: function(dataList) {
        const tbody = document.getElementById('userTableBody');
        if(dataList.length === 0) { 
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Tiada data dijumpai.</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = dataList.map(u => {
            let statusBadge = u.status.toUpperCase() === 'AKTIF' ? '<span class="badge bg-success">AKTIF</span>' : 
                              u.status.toUpperCase() === 'MENUNGGU' ? '<span class="badge bg-warning text-dark">MENUNGGU</span>' :
                              '<span class="badge bg-danger">' + u.status.toUpperCase() + '</span>';
                              
            let actionBtn = u.status.toUpperCase() === 'MENUNGGU' ? 
                `<button class="btn btn-sm btn-success fw-bold me-1" onclick="UserManager.updateUserStatus(${u.row}, 'AKTIF')"><i class="bi bi-check-lg"></i> LULUS</button>` : '';
            
            // KEMASKINI: Kata laluan disembunyikan secara default dengan topeng pelindung (dots)
            return `
            <tr>
                <td><div class="fw-bold text-dark text-uppercase">${u.nama}</div><div class="small text-muted">${u.jawatan} - ${u.negeri}</div></td>
                <td>${this.maskIC(u.ic)}</td>
                <td>
                    <span class="d-block small text-primary fw-bold"><i class="bi bi-person me-1"></i>${u.uid}</span>
                    <div class="d-flex align-items-center gap-1 mt-1">
                        <span class="small text-muted fw-bold font-monospace" id="pwd_${u.row}" data-pwd="${u.pwd}">••••••••</span>
                        <button class="btn btn-link p-0 text-secondary border-0 bg-transparent shadow-none" onclick="UserManager.togglePasswordVisibility(${u.row})" title="Lihat/Sembunyi Kata Laluan">
                            <i class="bi bi-eye" id="eye_${u.row}" style="font-size: 1rem; cursor: pointer;"></i>
                        </button>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${u.role}</span></td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    ${actionBtn}
                    <button class="btn btn-sm btn-outline-primary" onclick="UserManager.editUser(${u.row})" title="Kemaskini"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="UserManager.deleteUser(${u.row})" title="Padam Akaun"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>`;
        }).join('');
    },

    // FUNGSI BAHARU: Mengawal buka/tutup paparan kata laluan secara interaktif di skrin Admin
    togglePasswordVisibility: function(rowId) {
        const span = document.getElementById('pwd_' + rowId);
        const icon = document.getElementById('eye_' + rowId);
        if (span && icon) {
            const actualPwd = span.getAttribute('data-pwd');
            if (span.innerText === '••••••••') {
                span.innerText = actualPwd;
                span.classList.remove('text-muted');
                span.classList.add('text-danger');
                icon.className = 'bi bi-eye-slash';
            } else {
                span.innerText = '••••••••';
                span.classList.remove('text-danger');
                span.classList.add('text-muted');
                icon.className = 'bi bi-eye';
            }
        }
    },

    filterUsers: function() {
        const term = document.getElementById('searchUser').value.toLowerCase();
        const filtered = this.allUsersData.filter(u => 
            (u.nama && u.nama.toLowerCase().includes(term)) || 
            (u.ic && String(u.ic).includes(term)) || 
            (u.uid && u.uid.toLowerCase().includes(term))
        );
        this.renderUsers(filtered);
    },

    updateUserStatus: async function(row, newStatus) {
        if(!confirm(`Tukar status kepada ${newStatus}?`)) return;
        const r = await API.postData('updateUser', { row: row, field: 'status', value: newStatus });
        if(r.success) { this.loadUsers(); } else { alert("Ralat: " + r.message); }
    },

    deleteUser: async function(row) {
        const res = await Swal.fire({
            title: 'Padam Akaun?', text: "Tindakan ini KEKAL!", icon: 'warning', 
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6c757d', 
            confirmButtonText: '<i class="bi bi-trash"></i> Ya, Padam!', cancelButtonText: 'Batal'
        });
        if (res.isConfirmed) {
            Swal.fire({ title: 'Memadam...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const r = await API.postData('deleteUser', { row: row });
            if (r.success) { Swal.fire('Berjaya!', 'Akaun dipadam.', 'success'); this.loadUsers(); } 
            else { Swal.fire('Ralat', r.message, 'error'); }
        }
    },

    editUser: async function(row) {
        const u = this.allUsersData.find(x => x.row === row);
        if(!u) return;
        
        const { value: formValues } = await Swal.fire({
            title: 'Kemaskini Pengguna', width: '600px',
            html: `
                <div class="text-start row g-3">
                    <div class="col-12"><label class="small fw-bold">Nama Penuh</label><input id="swal-nama" class="form-control form-control-sm text-uppercase" value="${u.nama}"></div>
                    <div class="col-6"><label class="small fw-bold">No. K/P</label><input id="swal-ic" type="number" class="form-control form-control-sm" value="${u.ic}"></div>
                    <div class="col-6"><label class="small fw-bold">Jawatan</label><input id="swal-jawatan" class="form-control form-control-sm text-uppercase" value="${u.jawatan}"></div>
                    <div class="col-12"><label class="small fw-bold">Negeri Bertugas</label><select id="swal-negeri" class="form-select form-select-sm">
                        <option value="HQ / IBU PEJABAT" ${u.negeri==='HQ / IBU PEJABAT'?'selected':''}>HQ / IBU PEJABAT</option>
                        ${Object.keys(DISTRICT_DATA).map(n => `<option value="${n}" ${u.negeri===n?'selected':''}>${n}</option>`).join('')}
                    </select></div>
                    <div class="col-6 mt-3"><label class="small fw-bold text-primary">Username</label><input id="swal-uid" class="form-control form-control-sm" value="${u.uid}"></div>
                    <div class="col-6 mt-3"><label class="small fw-bold text-danger">Password</label><input id="swal-pwd" class="form-control form-control-sm" value="${u.pwd}"></div>
                    <div class="col-6 mt-3"><label class="small fw-bold">Peranan</label><select id="swal-role" class="form-select form-select-sm"><option value="STAFF" ${u.role==='STAF'?'selected':''}>STAFF</option><option value="PENYELIA" ${u.role==='PENYELIA'?'selected':''}>PENYELIA</option><option value="ADMIN" ${u.role==='ADMIN'?'selected':''}>ADMIN</option></select></div>
                    <div class="col-6 mt-3"><label class="small fw-bold text-warning">Status Akaun</label><select id="swal-status" class="form-select form-select-sm"><option value="AKTIF" ${u.status.toUpperCase()==='AKTIF'?'selected':''}>AKTIF</option><option value="MENUNGGU" ${u.status.toUpperCase()==='MENUNGGU'?'selected':''}>MENUNGGU</option><option value="DITOLAK" ${u.status.toUpperCase()==='DITOLAK'?'selected':''}>DITOLAK</option><option value="DIGANTUNG" ${u.status.toUpperCase()==='DIGANTUNG'?'selected':''}>DIGANTUNG</option></select></div>
                </div>
            `,
            focusConfirm: false, showCancelButton: true, confirmButtonText: 'Simpan',
            preConfirm: () => {
                return {
                    row: u.row, uid: document.getElementById('swal-uid').value.trim(), pwd: document.getElementById('swal-pwd').value.trim(), 
                    nama: document.getElementById('swal-nama').value.trim().toUpperCase(), negeri: document.getElementById('swal-negeri').value, 
                    role: document.getElementById('swal-role').value, jawatan: document.getElementById('swal-jawatan').value.trim().toUpperCase(), 
                    ic: document.getElementById('swal-ic').value.trim(), status: document.getElementById('swal-status').value
                }
            }
        });
        if (formValues) {
            Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const r = await API.postData('updateUser', { field: 'full_edit', ...formValues });
            if(r.success) { Swal.fire('Berjaya!', 'Maklumat pengguna dikemaskini.', 'success'); this.loadUsers(); } 
            else { Swal.fire('Ralat', r.message, 'error'); }
        }
    },

    maskIC: function(ic) {
        if (!ic || ic.length < 12) return ic;
        let clean = ic.replace(/[^0-9]/g, ""); 
        return clean.substring(0, 6) + "-**-" + clean.substring(10);
    }
};

// ==============================================================
// FUNGSI CARIAN PENGGUNA (REAL-TIME & EXACT MATCH)
// ==============================================================
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchUser"); 
    const tableBody = document.getElementById("userTableBody");

    if (searchInput && tableBody) {
        searchInput.addEventListener("input", function() {
            let filterValue = this.value.toLowerCase().trim();
            let rows = tableBody.getElementsByTagName("tr");

            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                let textData = row.textContent || row.innerText;

                if (textData.toLowerCase().includes(filterValue)) {
                    row.style.display = ""; 
                } else {
                    row.style.display = "none"; 
                }
            }
        });
    }
});
