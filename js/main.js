// ==========================================
// FAIL: js/main.js
// FUNGSI: Pengawal Utama (Controller) & Event Listeners
// ==========================================

// 1. Pendaftaran Service Worker & Pemaksa Hard Refresh Otomatik (Kalis Cache Lama)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((reg) => {
                console.log('✅ Service Worker berjaya didaftarkan. Skop:', reg.scope);
                
                // Jika sistem mengesan ada versi kod baru sedang menunggu, paksa bertukar terus
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            })
            .catch((err) => {
                console.error('❌ Pendaftaran Service Worker gagal:', err);
            });
    });

    // ⚡ HERO LOGIK: Apabila Service Worker versi baharu mengambil alih kawalan,
    // pelayar web peranti user akan automatik dimuat semula (Hard Reload) serta-merta!
    let statusReload = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!statusReload) {
            statusReload = true;
            window.location.reload();
        }
    });
}

// 2. Ambil Event Apabila DOM Selesai Dimuatkan
document.addEventListener("DOMContentLoaded", () => {
    // Initialize App & Check Session
    if (typeof AuthManager !== 'undefined') {
        AuthManager.checkSession();
        
        // Setup Event Listeners untuk Auth
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

    // Menu Navigation System
    document.querySelectorAll('[data-view]').forEach(item => {
        item.addEventListener('click', function() {
            ViewManager.switchTab(this.getAttribute('data-view'), this);
        });
    });

    // Dashboard Buttons
    if (typeof DashboardManager !== 'undefined') {
        const btnRefreshDash = document.getElementById('btnRefreshDash');
        if (btnRefreshDash) btnRefreshDash.addEventListener('click', () => DashboardManager.initDash());
        
        const btnPrevPg = document.getElementById('btnPrevPg');
        if (btnPrevPg) btnPrevPg.addEventListener('click', () => DashboardManager.movePg(-1));
        
        const btnNextPg = document.getElementById('btnNextPg');
        if (btnNextPg) btnNextPg.addEventListener('click', () => DashboardManager.movePg(1));
    }

    // Export Buttons
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
    
    // External Links
    const btnOpenRPW = document.getElementById('btnOpenRPW');
    if (btnOpenRPW) btnOpenRPW.addEventListener('click', () => window.open(CONFIG.RPW_URL, '_blank'));
    
    // Filtering (Date Inputs & Reset)
    if (typeof FilterManager !== 'undefined') {
        document.querySelectorAll('.filter-input').forEach(el => {
            el.addEventListener('change', () => FilterManager.runFilter());
        });
        const btnResetFilter = document.getElementById('btnResetFilter');
        if (btnResetFilter) btnResetFilter.addEventListener('click', FilterManager.resetFilter);
    }
}); 

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
        if (typeof AppState !== 'undefined' && AppState.uProf && AppState.uProf.name) {
            if (typeof VerifyManager !== 'undefined' && VerifyManager.checkPendingCount) {
                VerifyManager.checkPendingCount();
            }
            if (typeof TaskManager !== 'undefined' && TaskManager.checkTaskCount) {
                TaskManager.checkTaskCount();
            }
        }
    };
    setTimeout(semakBadges, 3000);
}

// Aktifkan sistem notifikasi
document.addEventListener("DOMContentLoaded", () => {
    startBadgePolling();
});
