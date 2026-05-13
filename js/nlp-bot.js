// =======================================================================
// FAIL: js/nlp-bot.js (NLP ENGINE V8 - THE ULTIMATE BULLETPROOF FIX)
// =======================================================================

const SmartNLPBot = {
    // MEMORI CHATBOT
    lastContext: { negeri: null, daerah: null, kategori: null, crop: null, pest: null },

    kamus: {
        negeri: {
            "johor": "JOHOR", "kedah": "KEDAH", "kelantan": "KELANTAN", "klate": "KELANTAN", 
            "melaka": "MELAKA", "n9": "NEGERI SEMBILAN", "negeri sembilan": "NEGERI SEMBILAN", 
            "pahang": "PAHANG", "perak": "PERAK", "perlis": "PERLIS", "penang": "PULAU PINANG", 
            "pulau pinang": "PULAU PINANG", "sabah": "SABAH", "sarawak": "SARAWAK", 
            "selangor": "SELANGOR", "terengganu": "TERENGGANU", "kl": "W.P. KUALA LUMPUR", "labuan": "W.P. LABUAN"
        },
        // 'Kelapa' dan 'Padi' dibuang dari sini supaya ia dibaca sebagai Tanaman (Crop) secara automatik
        kategori: {
            "buah": "BUAH-BUAHAN", "buahan": "BUAH-BUAHAN", 
            "sayur": "SAYUR-SAYURAN", "sayuran": "SAYUR-SAYURAN", 
            "kontan": "KONTAN", "ladang": "KONTAN"
        },
        perosakMasyhur: {
            "faw": ["FAW", "FALL ARMYWORM", "SPODOPTERA FRUGIPERDA"], 
            "ulat ratus": ["FAW", "FALL ARMYWORM"], 
            "rpw": ["RPW", "RED PALM WEEVIL", "KUMBANG MERAH"], 
            "kumbang tanduk": ["KUMBANG TANDUK", "ORYCTES RHINOCEROS"],
            "koya": ["KOYA", "MEALYBUG", "MEALY BUG"],
            "liriomyza": ["LIRIOMYZA", "PELOMBONG DAUN"],
            "apogonia": ["APOGONIA", "KUMBANG PEMAKAN DAUN"]
        }
    },

    toggle: function() {
        const win = document.getElementById('nlp-chatbot-window');
        if (win.style.display === 'flex') { win.style.display = 'none'; } 
        else { win.style.display = 'flex'; document.getElementById('nlp-chat-input').focus(); }
    },

    handleInput: function(chipText = null) {
        const inputEl = document.getElementById('nlp-chat-input');
        const text = chipText || inputEl.value;
        if (!text || text.trim() === '') return;
        
        inputEl.value = '';
        this.addMessage(text, 'user');
        
        const chatBody = document.getElementById('nlp-chat-messages');
        const loadingId = "load-" + Date.now();
        chatBody.insertAdjacentHTML('beforeend', `<div id="${loadingId}" class="chat-bubble bubble-bot text-muted small"><i class="bi bi-cpu"></i> Memproses analitik...</div>`);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            document.getElementById(loadingId).remove();
            const jawapan = this.prosesAyat(text);
            this.addMessage(jawapan, 'bot');
        }, 500);
    },

    addMessage: function(text, sender) {
        const chatBody = document.getElementById('nlp-chat-messages');
        const div = document.createElement('div');
        div.className = `chat-bubble bubble-${sender}`;
        div.innerHTML = text;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    getPestObj: function(dp) {
        if (!dp) return null;
        if (typeof dp === 'object') return dp; 
        if (typeof dp === 'string' && dp.includes('{')) {
            try { return JSON.parse(dp); } catch(e) { return null; }
        }
        return null;
    },

    // TEKNIK BARU: Padded Space Matching (Sangat tepat & kebal dari masalah tanda sengkang)
    findEntity: function(query, entityArray) {
        let q = " " + query.replace(/[^\w\s-]/gi, ' ') + " ";
        for (let word of entityArray) {
            if (!word) continue;
            let w = word.replace(/[^\w\s-]/gi, ' ').trim();
            if (w.length < 3) continue;
            if (q.includes(" " + w.toLowerCase() + " ")) return word;
        }
        return null;
    },

    // ==============================================================
    // CORE AI ENGINE V8 (THE ULTIMATE MASTERPIECE)
    // ==============================================================
    prosesAyat: function(soalan) {
        const db = AppState.mData;
        if (!db || db.length === 0) return "Sistem sedang memuatkan pangkalan data. Sila cuba sebentar lagi.";

        let query = soalan.toLowerCase().trim();
        
        // 1. DATA HARVESTING PINTAR (Tuai data dari Database secara live)
        let dbCrops = new Set(), dbDistricts = new Set(), dbPests = new Set();
        db.forEach(d => {
            if(d.tn) {
                let tnRaw = d.tn.toUpperCase().trim();
                dbCrops.add(tnRaw);
                // Pecahkan nama panjang supaya user boleh taip satu perkataan (Cth: KELAPA SAWIT -> SAWIT)
                tnRaw.replace(/[^\w\s]/g, ' ').split(/\s+/).forEach(w => { if(w.length >= 4) dbCrops.add(w); });
            }
            if(d.d) dbDistricts.add(d.d.toUpperCase().trim());
            let pObj = this.getPestObj(d.p);
            if(pObj) Object.keys(pObj).forEach(k => dbPests.add(k.toUpperCase().trim()));
        });

        // Sort by length supaya AI padankan nama yang lebih panjang dulu (Cth: KELAPA SAWIT dulu, baru KELAPA)
        let arrCrops = Array.from(dbCrops).sort((a,b) => b.length - a.length);
        let arrDistricts = Array.from(dbDistricts).sort((a,b) => b.length - a.length);
        let arrPests = Array.from(dbPests).sort((a,b) => b.length - a.length);

        // 2. EXTRAKSI ENTITI (BACA KONTEKS AYAT)
        let fNegeri = null, fKategori = null, fCrop = null, fDaerah = null, fPestSearch = null, fPestDisplayName = null;
        let clearMemory = query.includes("nasional") || query.includes("semua") || query.includes("reset") || query.includes("seluruh");

        if (!clearMemory) {
            for (let key in this.kamus.negeri) { if (new RegExp("\\b" + key + "\\b", "i").test(query)) fNegeri = this.kamus.negeri[key]; }
            for (let key in this.kamus.kategori) { if (new RegExp("\\b" + key + "\\b", "i").test(query)) fKategori = this.kamus.kategori[key]; }
            
            fCrop = this.findEntity(query, arrCrops);
            fDaerah = this.findEntity(query, arrDistricts);

            // Pengesanan Perosak Berperingkat
            for (let key in this.kamus.perosakMasyhur) { 
                if (new RegExp("\\b" + key.replace(/\s/g, '\\s?') + "\\b", "i").test(query)) {
                    fPestSearch = this.kamus.perosakMasyhur[key]; 
                    fPestDisplayName = this.kamus.perosakMasyhur[key][0]; break;
                } 
            }
            if (!fPestSearch) {
                let foundPest = this.findEntity(query, arrPests);
                if (foundPest) { fPestSearch = [foundPest]; fPestDisplayName = foundPest; }
            }

            // WARISAN MEMORI JIKA TIADA ENTITI BARU DIBERIKAN
            if (!fNegeri && this.lastContext.negeri) fNegeri = this.lastContext.negeri;
            if (!fDaerah && this.lastContext.daerah) fDaerah = this.lastContext.daerah;
            if (!fKategori && this.lastContext.kategori) fKategori = this.lastContext.kategori;
            if (!fCrop && this.lastContext.crop) fCrop = this.lastContext.crop;
            if (!fPestSearch && this.lastContext.pest) { fPestSearch = this.lastContext.pest.search; fPestDisplayName = this.lastContext.pest.display; }
        }

        // SIMPAN KE MEMORI BARU
        this.lastContext = { negeri: fNegeri, daerah: fDaerah, kategori: fKategori, crop: fCrop, pest: fPestSearch ? {search: fPestSearch, display: fPestDisplayName} : null };

        // 3. INTENT CLASSIFICATION (BACA NIAT SOALAN)
        let isSummary = /rumusan|ringkas|status|statistik|jumlah|berapa|luas|bancian|hektar/.test(query);
        let isTopPest = /top|tinggi|teruk|utama|perosak|ancaman|bahaya/.test(query);
        let isLocation = /mana|lokasi|tempat|senarai|kawasan|jejak/.test(query);
        let isTopCrop = /tanaman|pokok|komoditi|jenis/.test(query);

        // BINA TAG FILTER UI
        let filterTags = [];
        if(fDaerah) filterTags.push(fDaerah);
        if(fNegeri) filterTags.push(fNegeri);
        if(fCrop) filterTags.push(fCrop);
        if(fKategori && !fCrop) filterTags.push(fKategori);
        let tagHtml = filterTags.length > 0 ? `<div class="mb-3"><span class="badge bg-primary bg-opacity-10 text-primary border border-primary px-2 py-1"><i class="bi bi-funnel-fill"></i> Konteks: ${filterTags.join(" | ")}</span></div>` : `<div class="mb-3"><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-2 py-1"><i class="bi bi-globe"></i> Konteks: Nasional</span></div>`;

        // 4. PENGIRAAN ASAS UNTUK KONTEKS INI (Sangat penting untuk semak kawasan selamat)
        let masterLuasTanam = 0, masterLuasSerang = 0;
        db.forEach(d => {
            let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop);
            if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri)) && (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah)) && (!fKategori || (d.kt||"").toUpperCase().includes(fKategori)) && matchCrop) {
                masterLuasTanam += (parseFloat(d.lt)||0);
                masterLuasSerang += (parseFloat(d.ls)||0);
            }
        });

        // Jika langsung tiada data bancian direkodkan untuk kombinasi ini
        if (masterLuasTanam === 0) {
            return `${tagHtml}✅ Tiada sebarang data bancian mahupun serangan ditemui untuk konteks ini.`;
        }

        // AUTO-DASHBOARD (Jika soalan umum, kita beri Rumusan & Top Perosak)
        if (!isSummary && !isTopPest && !isLocation && !isTopCrop && !fPestSearch) {
            isSummary = true;
            if (masterLuasSerang > 0) isTopPest = true;
        }

        let htmlResponse = tagHtml;

        // --- BLOK: RUMUSAN ---
        if (isSummary) {
            let pct = masterLuasTanam > 0 ? ((masterLuasSerang/masterLuasTanam)*100).toFixed(2) : 0;
            htmlResponse += `<div class="bg-light p-2 rounded border mb-2" style="font-size:0.85rem;">📊 <b>Rumusan Keluasan:</b><br>• Bancian: <b>${masterLuasTanam.toLocaleString()} Ha</b><br>• Serangan: <b class="${pct>5?'text-danger':'text-warning'}">${masterLuasSerang.toLocaleString()} Ha</b> (${pct}%)</div>`;
        }

        // --- PENYELAMAT KAWASAN SELAMAT (ZERO ATTACK) ---
        if (masterLuasSerang === 0 && !fPestSearch) {
            if (!isSummary) { 
                htmlResponse += `<div class="bg-light p-2 rounded border mb-2" style="font-size:0.85rem;">📊 <b>Rumusan Keluasan:</b><br>• Bancian: <b>${masterLuasTanam.toLocaleString()} Ha</b><br>• Serangan: <b class="text-success">0 Ha</b> (0%)</div>`;
            }
            htmlResponse += `✅ Alhamdulillah, <b>tiada sebarang serangan perosak</b> direkodkan bagi kawasan ini. Tanaman selamat.`;
            return htmlResponse;
        }

        // --- BLOK: SENARAI TANAMAN TERLIBAT ---
        if (isTopCrop) {
            let kumpulTanam = {};
            db.forEach(d => {
                let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop);
                if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri)) && (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah)) && (!fKategori || (d.kt||"").toUpperCase().includes(fKategori)) && matchCrop) {
                    let ls = parseFloat(d.ls) || 0;
                    if(ls > 0) kumpulTanam[d.tn] = (kumpulTanam[d.tn] || 0) + ls;
                }
            });
            let sortTanam = Object.entries(kumpulTanam).sort((a,b) => b[1] - a[1]);
            if(sortTanam.length > 0) {
                htmlResponse += `🌾 <b>Tanaman Terjejas:</b><br>`;
                sortTanam.slice(0, 5).forEach((x, i) => {
                    let pct = masterLuasTanam > 0 ? ((x[1]/masterLuasTanam)*100).toFixed(1) : 0;
                    htmlResponse += `<div class="mb-1 d-flex justify-content-between border-bottom pb-1" style="font-size:0.8rem;"><span>${i+1}. ${x[0]}</span> <span><b>${x[1].toFixed(2)} Ha</b> <small class="${pct>5?'text-danger':'text-warning'}">(${pct}%)</small></span></div>`;
                });
                htmlResponse += `<br>`;
            }
        }

        // --- BLOK: TOP PEROSAK KESELURUHAN ---
        if (isTopPest && !fPestSearch) {
            let kumpul = {};
            db.forEach(d => {
                let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop);
                if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri)) && (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah)) && matchCrop && (!fKategori || (d.kt||"").toUpperCase().includes(fKategori))) {
                    let pestObj = this.getPestObj(d.p);
                    if (pestObj) {
                        Object.keys(pestObj).forEach(k => { 
                            let luas = parseFloat(pestObj[k]) || 0;
                            if(luas > 0) kumpul[k] = (kumpul[k] || 0) + luas; 
                        });
                    }
                }
            });
            let sortPest = Object.entries(kumpul).sort((a,b) => b[1] - a[1]);
            if(sortPest.length > 0) {
                htmlResponse += `🔥 <b>Ancaman Tertinggi:</b><br>`;
                sortPest.slice(0, 5).forEach((x, i) => {
                    let pct = masterLuasTanam > 0 ? ((x[1]/masterLuasTanam)*100).toFixed(1) : 0;
                    htmlResponse += `<div class="mb-1 d-flex justify-content-between border-bottom pb-1" style="font-size:0.8rem;"><span>${i+1}. ${x[0]}</span> <span><b>${x[1].toFixed(2)} Ha</b> <small class="${pct>5?'text-danger':'text-warning'}">(${pct}%)</small></span></div>`;
                });
                htmlResponse += `<br>`;
            }
        }

        // --- BLOK: TOP LOKASI (ATAU JEJAK PEROSAK SPESIFIK) ---
        if (isLocation || fPestSearch) {
            let locList = [];
            db.forEach(d => {
                let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop);
                if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri)) && (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah)) && matchCrop && (!fKategori || (d.kt||"").toUpperCase().includes(fKategori))) {
                    
                    let luasAtt = 0;
                    if(fPestSearch) { 
                        let pObj = this.getPestObj(d.p);
                        if (pObj) {
                            let matchKey = Object.keys(pObj).find(dbKey => fPestSearch.some(synonym => dbKey.toUpperCase().includes(synonym)));
                            if(matchKey) luasAtt = parseFloat(pObj[matchKey]) || 0;
                        }
                    } else {
                        luasAtt = parseFloat(d.ls) || 0;
                    }

                    if(luasAtt > 0) locList.push({ lok: d.l, daerah: d.d, neg: d.n, tanam: d.tn, luasTanam: parseFloat(d.lt)||0, luasSerang: luasAtt });
                }
            });
            locList.sort((a,b) => b.luasSerang - a.luasSerang);
            if(locList.length > 0) {
                let tajuk = fPestSearch ? `📍 <b>Kawasan Diserang ${fPestDisplayName}:</b><br>` : `📍 <b>Kawasan Terjejas Teruk:</b><br>`;
                htmlResponse += tajuk;
                locList.slice(0, 5).forEach((x, i) => {
                    let pct = x.luasTanam > 0 ? ((x.luasSerang/x.luasTanam)*100).toFixed(1) : 0;
                    let color = pct > 10 ? 'text-danger' : (pct > 5 ? 'text-warning' : 'text-success');
                    htmlResponse += `<div class="mb-2 p-2 bg-light rounded" style="font-size:0.8rem; border-left: 3px solid ${pct > 10 ? '#dc3545' : '#ffc107'};"><b>${i+1}. ${x.lok}</b> (${x.daerah||x.neg})<br><span class="text-muted">🌱 ${x.tanam} | ⚠️ <b>${x.luasSerang.toFixed(2)} Ha</b> <span class="fw-bold ${color}">(${pct}%)</span></span></div>`;
                });
            } else if (fPestSearch) {
                htmlResponse += `✅ Tiada serangan aktif bagi <b>${fPestDisplayName}</b> ditemui dalam kawasan ini.`;
            }
        }

        return htmlResponse;
    }
};
