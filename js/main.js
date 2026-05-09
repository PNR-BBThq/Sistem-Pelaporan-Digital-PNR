// ==========================================
// FAIL: js/main.js
// FUNGSI: Pengawal Utama (Controller) & Event Listeners
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize App & Check Session
    if (typeof AuthManager !== 'undefined') {
        AuthManager.checkSession();
        
        // 2. Setup Event Listeners untuk Auth
        document.getElementById('btnLogin').addEventListener('click', AuthManager.doLogin);
        document.getElementById('btnLogout').addEventListener('click', AuthManager.doLogout);
        document.getElementById('btnLupaPwd').addEventListener('click', AuthManager.lupaKatalaluan);
        
        // Butang Daftar & Kembali (Borang HTML)
        const btnDaftar = document.getElementById('btnSubmitDaftar');
        if (btnDaftar) btnDaftar.addEventListener('click', AuthManager.toggleDaftar);
        
        const btnBack = document.getElementById('btnBackLogin');
        if (btnBack) btnBack.addEventListener('click', () => {
            document.getElementById('formDaftar').style.display = 'none';
            document.getElementById('formLogin').style.display = 'block';
        });

        const btnShowDaftar = document.getElementById('btnShowDaftar');
        if (btnShowDaftar) btnShowDaftar.addEventListener('click', () => {
            document.getElementById('formLogin').style.display = 'none';
            document.getElementById('formDaftar').style.display = 'block';
        });
    }

    // 3. Menu Navigation System
    document.querySelectorAll('[data-view]').forEach(item => {
        item.addEventListener('click', function() {
            ViewManager.switchTab(this.getAttribute('data-view'), this);
        });
    });

    // 4. Dashboard Buttons
    if (typeof DashboardManager !== 'undefined') {
        const btnRefreshDash = document.getElementById('btnRefreshDash');
        if (btnRefreshDash) btnRefreshDash.addEventListener('click', () => DashboardManager.initDash());
        
        const btnPrevPg = document.getElementById('btnPrevPg');
        if (btnPrevPg) btnPrevPg.addEventListener('click', () => DashboardManager.movePg(-1));
        
        const btnNextPg = document.getElementById('btnNextPg');
        if (btnNextPg) btnNextPg.addEventListener('click', () => DashboardManager.movePg(1));
    }

    // 5. Export Buttons
    if (typeof ExportManager !== 'undefined') {
        const btnDlExcel = document.getElementById('btnDlExcel');
        if (btnDlExcel) btnDlExcel.addEventListener('click', ExportManager.downloadDualExcel);
        
        const btnDlPDF = document.getElementById('btnDlPDF');
        if (btnDlPDF) btnDlPDF.addEventListener('click', ExportManager.dlPDF);
        
        const btnDlGeoJSON = document.getElementById('btnDlGeoJSON');
        if (btnDlGeoJSON) btnDlGeoJSON.addEventListener('click', ExportManager.downloadGeoJSON);
        
        const btnDlKML = document.getElementById('btnDlKML');
        if (btnDlKML) btnDlKML.addEventListener('click', ExportManager.downloadKML);
    }
    
    // 6. External Links
    const btnOpenRPW = document.getElementById('btnOpenRPW');
    if (btnOpenRPW) btnOpenRPW.addEventListener('click', () => window.open(CONFIG.RPW_URL, '_blank'));
    
    // 7. Filtering (Date Inputs & Reset)
    if (typeof FilterManager !== 'undefined') {
        document.querySelectorAll('.filter-input').forEach(el => {
            el.addEventListener('change', () => FilterManager.runFilter());
        });
        const btnResetFilter = document.getElementById('btnResetFilter');
        if (btnResetFilter) btnResetFilter.addEventListener('click', FilterManager.resetFilter);
    }
}); // <--- INI ADALAH PENUTUP YANG HILANG TADI!

// ==========================================
// PENGURUSAN PAPARAN (UI / TABS)
// ==========================================
const ViewManager = {
    switchTab: function(t, el) {
        document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active')); 
        document.querySelectorAll('.nav-bot-item').forEach(x => x.classList.remove('active'));
        
        if(el) {
            if(!el.classList.contains('bg-success') && el.classList.contains('nav-item')) el.classList.add('active');
            if(el.classList.contains('nav-bot-item')) el.classList.add('active');
        }

        ['view-main','view-verify','view-tasks','view-form', 'view-users', 'view-sku'].forEach(v => {
    const view = document.getElementById(v);
    if(view) view.style.display = 'none';
});
        
        const targetView = document.getElementById('view-'+t);
        if(targetView) targetView.style.display = 'block';

        if(t === 'verify' && typeof VerifyManager !== 'undefined') VerifyManager.loadPend();
        if(t === 'tasks' && typeof TaskManager !== 'undefined') TaskManager.loadMyTasks();
        if(t === 'users' && typeof UserManager !== 'undefined') UserManager.loadUsers();
        if(t === 'sku' && typeof KPIManager !== 'undefined') KPIManager.init();
        
        if(t === 'main' && typeof MapManager !== 'undefined' && MapManager.map) {
            setTimeout(() => MapManager.map.invalidateSize(), 300);
        }
        
        const sidebar = document.getElementById('sidebar');
        if(sidebar) sidebar.classList.remove('active');
        const overlay = document.getElementById('mobileOverlay');
        if(overlay) overlay.classList.remove('active');
    }
};

// ==========================================
// SISTEM NOTIFIKASI LATAR BELAKANG (AUTO-SEMAK)
// ==========================================
function startBadgePolling() {
    const semakBadges = () => {
        // Pastikan user dah login (ada profile) sebelum buat semakan
        if (typeof AppState !== 'undefined' && AppState.uProf && AppState.uProf.name) {
            
            // Semak badge Pengesahan (Admin/Penyelia sahaja)
            if (typeof VerifyManager !== 'undefined' && VerifyManager.checkPendingCount) {
                VerifyManager.checkPendingCount();
            }
            
            // Semak badge Tugasan Saya (Semua staf)
            if (typeof TaskManager !== 'undefined' && TaskManager.checkTaskCount) {
                TaskManager.checkTaskCount();
            }
        }
    };

    // 1. Semak serta-merta selepas 3 saat sistem dibuka (memberi ruang untuk proses login selesai)
    setTimeout(semakBadges, 3000);

    // 2. Semak secara automatik setiap 60 saat (1 Minit)
    setInterval(semakBadges, 60000);
}

// Aktifkan sistem notifikasi
document.addEventListener("DOMContentLoaded", () => {
    startBadgePolling();
});
