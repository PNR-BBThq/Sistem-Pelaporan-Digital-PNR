// js/config.js
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbyKB5-TBuZ8JXs1pz9s7LBCT5stsFaNP8fMzw8UvbPYbKCWuus8mSuDdaLFaK1PNDG8/exec",
    RPW_URL: "https://www.appsheet.com/start/55b088df-3ec1-469a-b5c6-1fca48052906",
    FREE_ROUTES: ['login', 'registerUser', 'verifyForgotPwd', 'updateMyAccess']
};

const DISTRICT_DATA = {
    "JOHOR": ["BATU PAHAT", "JOHOR BAHRU", "KLUANG", "KOTA TINGGI", "KULAI", "MERSING", "MUAR", "PONTIAN", "SEGAMAT", "TANGKAK"],
    // ... (Masukkan senarai daerah penuh Tuan di sini) ...
};

// State Variables (Global for the app but encapsulated properly via modules later if using Webpack, but fine for plain JS)
const AppState = {
    mData: [], fData: [],
    uProf: null, userToken: "", currentUserID: "",
    pestMasterData: {}, currentHeaders: [],
    myTasksData: [], currentPendingRows: [],
    pg: 1, pSize: 10
};
