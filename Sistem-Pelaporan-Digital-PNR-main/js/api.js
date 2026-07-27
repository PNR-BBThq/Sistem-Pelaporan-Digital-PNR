
// ==========================================
// FAIL: js/api.js
// FUNGSI: Menguruskan komunikasi dengan Google Apps Script (Backend)
// ==========================================

const API = {
    postData: async function(action, payloadData = {}) {
        try {
            let payload = { action: action, ...payloadData };
            
            // Masukkan token sekuriti jika ia bukan laluan bebas (cth: bukan login/register)
            if (!CONFIG.FREE_ROUTES.includes(action)) {
                payload.token = AppState.userToken;
                payload.u = AppState.currentUserID;
            }
            
            // Hantar request ke Google Apps Script
            const res = await fetch(`${CONFIG.API_URL}?action=${action}`, { 
                method: "POST", 
                headers: { "Content-Type": "text/plain" }, 
                body: JSON.stringify(payload) 
            });
            
            const responseData = JSON.parse(await res.text());

            // Tangkap ralat jika sesi tamat (Token Expired)
            if (!CONFIG.FREE_ROUTES.includes(action) && responseData.success === false && 
                responseData.message && (responseData.message.includes("sesi") || responseData.message.includes("token"))) {
                alert("⛔ Sesi tamat. Sila log masuk semula."); 
                AuthManager.doLogout();
                return { success: false }; 
            }
            
            return responseData;
            
        } catch(e) { 
            console.error("API Error:", e); 
            return { success: false, message: "Ralat sambungan pelayan. Sila semak internet anda." }; 
        }
    }
};
