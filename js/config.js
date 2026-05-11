// js/config.js
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbyKB5-TBuZ8JXs1pz9s7LBCT5stsFaNP8fMzw8UvbPYbKCWuus8mSuDdaLFaK1PNDG8/exec",
    RPW_URL: "https://www.appsheet.com/start/55b088df-3ec1-469a-b5c6-1fca48052906",
    FREE_ROUTES: ['login', 'registerUser', 'verifyForgotPwd', 'updateMyAccess']
};

const DISTRICT_DATA = {
    "JOHOR": [
        "BATU PAHAT", "JOHOR BAHRU", "KLUANG", "KOTA TINGGI", "KULAI", 
        "MERSING", "MUAR", "PONTIAN", "SEGAMAT", "TANGKAK"
    ],
    "KEDAH": [
        "BALING", "BANDAR BAHARU", "KOTA SETAR", "KUALA MUDA", "KUBANG PASU", 
        "KULIM", "LANGKAWI", "PADANG TERAP", "PENDANG", "POKOK SENA", "SIK", "YAN"
    ],
    "KELANTAN": [
        "BACHOK", "GUA MUSANG", "JELI", "KOTA BHARU", "KUALA KRAI", 
        "LOJING", "MACHANG", "PASIR MAS", "PASIR PUTEH", "TANAH MERAH", "TUMPAT"
    ],
    "MELAKA": [
        "ALOR GAJAH", "JASIN", "MELAKA TENGAH"
    ],
    "NEGERI SEMBILAN": [
        "JELEBU", "JEMPOL", "KUALA PILAH", "PORT DICKSON", "REMBAU", 
        "SEREMBAN", "TAMPIN"
    ],
    "PAHANG": [
        "BENTONG", "BERA", "CAMERON HIGHLANDS", "JERANTUT", "KUANTAN", 
        "LIPIS", "MARAN", "PEKAN", "RAUB", "ROMPIN", "TEMERLOH"
    ],
    "PERAK": [
        "BAGAN DATUK", "BATANG PADANG", "HILIR PERAK", "HULU PERAK", "KAMPAR", 
        "KERIAN", "KINTA", "KUALA KANGSAR", "LARUT, MATANG DAN SELAMA", 
        "MANJUNG", "MUALLIM", "PERAK TENGAH"
    ],
    "PERLIS": [
        "PERLIS"
    ],
    "PULAU PINANG": [
        "BARAT DAYA", "SEBERANG PERAI SELATAN", "SEBERANG PERAI TENGAH", 
        "SEBERANG PERAI UTARA", "TIMUR LAUT"
    ],
    "SABAH": [
        "BEAUFORT", "BELURAN", "KALABAKAN", "KENINGAU", "KINABATANGAN", 
        "KOTA BELUD", "KOTA KINABALU", "KOTA MARUDU", "KUALA PENYU", "KUDAT", 
        "KUNAK", "LAHAD DATU", "NABAWAN", "PAPAR", "PENAMPANG", "PITAS", 
        "PUTATAN", "RANAU", "SANDAKAN", "SEMPORNA", "SIPITANG", "TAMBUNAN", 
        "TAWAU", "TELUPID", "TENOM", "TONGOD", "TUARAN"
    ],
    "SARAWAK": [
        "ASAJAYA", "BAU", "BELAGA", "BELURU", "BETONG", "BINTULU", "BUKIT MABONG", 
        "DALAT", "DARO", "JULAU", "KABONG", "KANOWIT", "KAPIT", "KUCHING", 
        "LAWAS", "LIMBANG", "LUBUK ANTU", "LUNDU", "MARUDI", "MATU", "MERADONG", 
        "MIRI", "MUKAH", "PUSA", "SAMARAHAN", "SARATOK", "SARIKEI", "SEBAUH", 
        "SELANGAU", "SERIAN", "SIBU", "SIMUNJAN", "SONG", "SRI AMAN", "SUBIS", 
        "TATAU", "TEBEDU", "TELANG USAN"
    ],
    "SELANGOR": [
        "GOMBAK", "HULU LANGAT", "HULU SELANGOR", "KLANG", "KUALA LANGAT", 
        "KUALA SELANGOR", "PETALING", "SABAK BERNAM", "SEPANG"
    ],
    "TERENGGANU": [
        "BESUT", "DUNGUN", "HULU TERENGGANU", "KEMAMAN", "KUALA NERUS", 
        "KUALA TERENGGANU", "MARANG", "SETIU"
    ],
    "W.P. KUALA LUMPUR": [
        "KUALA LUMPUR"
    ],
    "W.P. LABUAN": [
        "LABUAN"
    ],
    "W.P. PUTRAJAYA": [
        "PUTRAJAYA"
    ]
};

// State Variables (Global for the app but encapsulated properly via modules later if using Webpack, but fine for plain JS)
const AppState = {
    mData: [], fData: [],
    uProf: null, userToken: "", currentUserID: "",
    pestMasterData: {}, currentHeaders: [],
    myTasksData: [], currentPendingRows: [],
    pg: 1, pSize: 10
};
