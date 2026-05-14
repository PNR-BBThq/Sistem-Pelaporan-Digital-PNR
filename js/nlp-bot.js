// =======================================================================
// FILE: js/nlp-bot.js (NLP ENGINE V9 - ENHANCED ULTIMATE EDITION)
// =======================================================================

const SmartNLPBot = {
    // MEMORI CHATBOT
    lastContext: { negeri: null, daerah: null, kategori: null, crop: null, pest: null },
    history: [], // Simpan 5 soalan terakhir untuk rujukan

    kamus: {
        negeri: {
            "johor": "JOHOR", "kedah": "KEDAH", "kelantan": "KELANTAN", "klate": "KELANTAN", 
            "melaka": "MELAKA", "n9": "NEGERI SEMBILAN", "negeri sembilan": "NEGERI SEMBILAN", 
            "pahang": "PAHANG", "perak": "PERAK", "perlis": "PERLIS", "penang": "PULAU PINANG", 
            "pulau pinang": "PULAU PINANG", "sabah": "SABAH", "sarawak": "SARAWAK", 
            "selangor": "SELANGOR", "terengganu": "TERENGGANU", "kl": "W.P. KUALA LUMPUR", 
            "labuan": "W.P. LABUAN", "putrajaya": "W.P. PUTRAJAYA"
        },
        kategori: {
            "buah": "BUAH-BUAHAN", "buahan": "BUAH-BUAHAN", 
            "sayur": "SAYUR-SAYURAN", "sayuran": "SAYUR-SAYURAN", 
            "kontan": "KONTAN", "ladang": "KONTAN",
            "bijirin": "BIJIRIN", "kekacang": "KEKACANG",
            "herba": "HERBA & REMPAH", "rempah": "HERBA & REMPAH",
            "bunga": "BUNGA-BUNGAAN & HIASAN", "hiasan": "BUNGA-BUNGAAN & HIASAN"
        },
        perosakMasyhur: {
            "faw": ["FAW", "FALL ARMYWORM", "SPODOPTERA FRUGIPERDA", "ULAT RATUS JAGUNG"], 
            "ulat ratus": ["FAW", "FALL ARMYWORM", "ULAT RATUS"],
            "fall armyworm": ["FAW", "FALL ARMYWORM", "SPODOPTERA FRUGIPERDA"],
            "rpw": ["RPW", "RED PALM WEEVIL", "KUMBANG MERAH", "KUMBANG MERAH KELAPA"], 
            "kumbang merah": ["RPW", "RED PALM WEEVIL", "KUMBANG MERAH"],
            "red palm weevil": ["RPW", "RED PALM WEEVIL", "KUMBANG MERAH"],
            "kumbang tanduk": ["KUMBANG TANDUK", "ORYCTES RHINOCEROS", "KUMBANG BADAK"],
            "oryctes": ["KUMBANG TANDUK", "ORYCTES RHINOCEROS"],
            "kumbang badak": ["KUMBANG TANDUK", "ORYCTES RHINOCEROS"],
            "koya": ["KOYA", "MEALYBUG", "MEALY BUG", "KOYA JAGUNG"],
            "mealybug": ["KOYA", "MEALYBUG", "MEALY BUG"],
            "mealy bug": ["KOYA", "MEALYBUG", "MEALY BUG"],
            "liriomyza": ["LIRIOMYZA", "PELOMBONG DAUN", "LIRIOMYZA SPP"],
            "pelombong daun": ["LIRIOMYZA", "PELOMBONG DAUN"],
            "apogonia": ["APOGONIA", "KUMBANG PEMAKAN DAUN", "APOGONIA SPP"],
            "kumbang pemakan daun": ["APOGONIA", "KUMBANG PEMAKAN DAUN"],
            "ganoderma": ["GANODERMA", "BUSUK PANGKAL BATANG", "GANODERMA SPP"],
            "busuk pangkal": ["GANODERMA", "BUSUK PANGKAL BATANG"],
            "bph": ["BPH", "BROWN PLANTHOPPER", "BENA PERANG"],
            "bena perang": ["BPH", "BROWN PLANTHOPPER", "BENA PERANG"],
            "brown planthopper": ["BPH", "BROWN PLANTHOPPER", "BENA PERANG"],
            "tikus": ["TIKUS", "RODENT", "RATTUS SPP"],
            "rodent": ["TIKUS", "RODENT", "RATTUS SPP"],
            "ulat daun": ["ULAT DAUN", "CATERPILLAR", "LARVA PEMAKAN DAUN"],
            "caterpillar": ["ULAT DAUN", "CATERPILLAR", "LARVA PEMAKAN DAUN"],
            "belalang": ["BELALANG", "GRASSHOPPER", "LOCUST"],
            "grasshopper": ["BELALANG", "GRASSHOPPER", "LOCUST"],
            "locust": ["BELALANG", "GRASSHOPPER", "LOCUST"],
            "kutu daun": ["KUTU DAUN", "APHID", "APID"],
            "aphid": ["KUTU DAUN", "APHID", "APID"],
            "thrips": ["THRIPS", "TRIPS", "KUTU KERINTING"],
            "kutu kerinting": ["THRIPS", "TRIPS", "KUTU KERINTING"],
            "whitefly": ["WHITEFLY", "LALAT PUTIH", "KUTU PUTIH"],
            "lalat putih": ["WHITEFLY", "LALAT PUTIH", "KUTU PUTIH"],
            "kutu putih": ["WHITEFLY", "LALAT PUTIH", "KUTU PUTIH"],
            "antraknosa": ["ANTRAKNOSA", "ANTHRACNOSE", "BINTIK DAUN"],
            "anthracnose": ["ANTRAKNOSA", "ANTHRACNOSE", "BINTIK DAUN"],
            "bintik daun": ["ANTRAKNOSA", "ANTHRACNOSE", "BINTIK DAUN"],
            "kulat": ["KULAT", "FUNGUS", "CENDAWAN"],
            "fungus": ["KULAT", "FUNGUS", "CENDAWAN"],
            "cendawan": ["KULAT", "FUNGUS", "CENDAWAN"],
            "bakteria": ["BAKTERIA", "BACTERIA", "PENYAKIT BAKTERIA"],
            "bacteria": ["BAKTERIA", "BACTERIA", "PENYAKIT BAKTERIA"],
            "virus": ["VIRUS", "PENYAKIT VIRUS", "VIRAL DISEASE"],
            "penyakit virus": ["VIRUS", "PENYAKIT VIRUS", "VIRAL DISEASE"],
            "nematod": ["NEMATOD", "NEMATODE", "CACING TANAH"],
            "nematode": ["NEMATOD", "NEMATODE", "CACING TANAH"],
            "kumbang": ["KUMBANG", "BEETLE", "KUMBANG PEROSAK"],
            "beetle": ["KUMBANG", "BEETLE", "KUMBANG PEROSAK"],
            "ulat": ["ULAT", "CATERPILLAR", "LARVA"],
            "larva": ["ULAT", "CATERPILLAR", "LARVA"]
        },
        // Sinonim tanaman untuk pengesanan lebih baik
        tanamanSinonim: {
            "kelapa sawit": ["SAWIT", "OIL PALM", "KELAPA SAWIT"],
            "getah": ["GETAH", "RUBBER", "HEVEA"],
            "padi": ["PADI", "BERAS", "RICE"],
            "jagung": ["JAGUNG", "CORN", "MAIZE"],
            "koko": ["KOKO", "COCOA", "KAKAO"],
            "kelapa": ["KELAPA", "COCONUT"],
            "pisang": ["PISANG", "BANANA"],
            "nanas": ["NANAS", "PINEAPPLE"],
            "tebu": ["TEBU", "SUGARCANE"],
            "tembikai": ["TEMBIKAI", "WATERMELON"],
            "sayur-sayuran": ["SAYUR", "VEGETABLE"],
            "buah-buahan": ["BUAH", "FRUIT"]
        }
    },

    toggle: function() {
        const win = document.getElementById('nlp-chatbot-window');
        if (win.style.display === 'flex') { 
            win.style.display = 'none'; 
        } else { 
            win.style.display = 'flex'; 
            document.getElementById('nlp-chat-input').focus(); 
        }
    },

    handleInput: function(chipText = null) {
        const inputEl = document.getElementById('nlp-chat-input');
        const text = chipText || inputEl.value;
        if (!text || text.trim() === '') return;
        
        inputEl.value = '';
        this.addMessage(text, 'user');
        
        const chatBody = document.getElementById('nlp-chat-messages');
        const loadingId = "load-" + Date.now();
        chatBody.insertAdjacentHTML('beforeend', `<div id="${loadingId}" class="chat-bubble bubble-bot text-muted small"><i class="bi bi-cpu"></i> Menganalisis data...</div>`);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            const loadEl = document.getElementById(loadingId);
            if (loadEl) loadEl.remove();
            const jawapan = this.prosesAyat(text);
            this.addMessage(jawapan, 'bot');
            
            // Simpan dalam history
            this.history.push({ question: text, answer: jawapan });
            if (this.history.length > 5) this.history.shift();
        }, 600);
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

    // Fungsi helper untuk normalisasi teks
    normalizeText: function(text) {
        if (!text) return "";
        return text.replace(/[^\w\s-]/gi, ' ').replace(/\s+/g, ' ').trim();
    },

    // Padded Space Matching (Sangat tepat & kebal dari masalah tanda sengkang)
    findEntity: function(query, entityArray) {
        let q = " " + this.normalizeText(query).toLowerCase() + " ";
        // Sort by length descending untuk padankan nama panjang dulu
        let sorted = [...entityArray].filter(Boolean).sort((a, b) => b.length - a.length);
        
        for (let word of sorted) {
            if (!word) continue;
            let w = this.normalizeText(word).toLowerCase();
            if (w.length < 3) continue;
            if (q.includes(" " + w + " ")) return word;
        }
        return null;
    },

    // Carian sinonim tanaman
    findCropSynonym: function(query) {
        let q = this.normalizeText(query).toLowerCase();
        for (let [cropName, synonyms] of Object.entries(this.kamus.tanamanSinonim)) {
            if (q.includes(cropName.toLowerCase())) return cropName;
            for (let syn of synonyms) {
                if (q.includes(syn.toLowerCase())) return cropName;
            }
        }
        return null;
    },

    // Dapatkan contoh soalan berdasarkan data
    getContohSoalan: function(db) {
        let examples = [];
        let uniqueNegeri = [...new Set(db.map(d => d.n).filter(Boolean))].slice(0, 3);
        let uniqueCrops = [...new Set(db.map(d => d.tn).filter(Boolean))].slice(0, 3);
        let uniquePests = new Set();
        db.forEach(d => {
            let pObj = this.getPestObj(d.p);
            if (pObj) Object.keys(pObj).forEach(k => { if (parseFloat(pObj[k]) > 0) uniquePests.add(k); });
        });
        let arrPests = [...uniquePests].slice(0, 3);

        if (uniqueNegeri.length > 0) {
            examples.push(`📌 "Ringkasan serangan di ${uniqueNegeri[0]}"`);
            examples.push(`📌 "Top perosak di ${uniqueNegeri[0]}"`);
        }
        if (uniqueCrops.length > 0) {
            examples.push(`📌 "Status serangan ${uniqueCrops[0]}"`);
        }
        if (arrPests.length > 0) {
            examples.push(`📌 "Kawasan diserang ${arrPests[0]}"`);
        }
        if (uniqueNegeri.length >= 2) {
            examples.push(`📌 "Beza serangan ${uniqueNegeri[0]} dan ${uniqueNegeri[1]}"`);
        }
        examples.push(`📌 "Senarai tanaman diserang"`);
        examples.push(`📌 "Rumusan nasional"`);
        
        return examples.slice(0, 6).join('<br>');
    },

    // ==============================================================
    // CORE AI ENGINE V9 (ENHANCED ULTIMATE MASTERPIECE)
    // ==============================================================
    prosesAyat: function(soalan) {
        const db = AppState.mData;
        if (!db || db.length === 0) return `<div class="text-center py-3"><i class="bi bi-hourglass-split text-warning" style="font-size:1.5rem;"></i><br>Sistem sedang memuatkan pangkalan data.<br>Sila cuba sebentar lagi.</div>`;

        let query = soalan.toLowerCase().trim();
        
        // 1. DATA HARVESTING PINTAR (Tuai data dari Database secara live)
        let dbCrops = new Set(), dbDistricts = new Set(), dbPests = new Set(), dbNegeri = new Set();
        db.forEach(d => {
            if(d.tn) {
                let tnRaw = d.tn.toUpperCase().trim();
                dbCrops.add(tnRaw);
                // Pecahkan nama panjang
                this.normalizeText(tnRaw).split(/\s+/).forEach(w => { 
                    if(w.length >= 4) dbCrops.add(w); 
                });
            }
            if(d.d) dbDistricts.add(d.d.toUpperCase().trim());
            if(d.n) dbNegeri.add(d.n.toUpperCase().trim());
            let pObj = this.getPestObj(d.p);
            if(pObj) Object.keys(pObj).forEach(k => dbPests.add(k.toUpperCase().trim()));
        });

        // Sort by length supaya padankan nama panjang dulu
        let arrCrops = Array.from(dbCrops).sort((a,b) => b.length - a.length);
        let arrDistricts = Array.from(dbDistricts).sort((a,b) => b.length - a.length);
        let arrPests = Array.from(dbPests).sort((a,b) => b.length - a.length);
        let arrNegeri = Array.from(dbNegeri).sort((a,b) => b.length - a.length);

        // 2. EXTRAKSI ENTITI (BACA KONTEKS AYAT)
        let fNegeri = null, fKategori = null, fCrop = null, fDaerah = null, 
            fPestSearch = null, fPestDisplayName = null;
        let clearMemory = query.includes("nasional") || query.includes("semua") || 
                         query.includes("reset") || query.includes("seluruh") ||
                         query.includes("malaysia");

        if (!clearMemory) {
            // Kesan negeri (dari kamus dan dari data)
            for (let key in this.kamus.negeri) { 
                if (new RegExp("\\b" + key + "\\b", "i").test(query)) {
                    fNegeri = this.kamus.negeri[key]; 
                    break;
                }
            }
            if (!fNegeri) fNegeri = this.findEntity(query, arrNegeri);
            
            // Kesan kategori
            for (let key in this.kamus.kategori) { 
                if (new RegExp("\\b" + key + "\\b", "i").test(query)) {
                    fKategori = this.kamus.kategori[key]; 
                    break;
                }
            }
            
            // Kesan tanaman (dari kamus sinonim dulu, baru dari data)
            let cropSynonym = this.findCropSynonym(query);
            if (cropSynonym) fCrop = cropSynonym;
            if (!fCrop) fCrop = this.findEntity(query, arrCrops);
            
            // Kesan daerah
            fDaerah = this.findEntity(query, arrDistricts);

            // Kesan perosak (dari kamus masyhur dulu, baru dari data)
            for (let key in this.kamus.perosakMasyhur) { 
                if (new RegExp("\\b" + key.replace(/\s/g, '\\s?') + "\\b", "i").test(query)) {
                    fPestSearch = this.kamus.perosakMasyhur[key]; 
                    fPestDisplayName = this.kamus.perosakMasyhur[key][0]; 
                    break;
                } 
            }
            if (!fPestSearch) {
                let foundPest = this.findEntity(query, arrPests);
                if (foundPest) { 
                    fPestSearch = [foundPest]; 
                    fPestDisplayName = foundPest; 
                }
            }

            // WARISAN MEMORI (untuk soalan susulan ringkas)
            let isFollowUp = /bagaimana\spula|kalau\s(.+)|untuk\s(.+)|pula\s(.+)|dan\s(.+)/i.test(query);
            
            if (!fNegeri && !isFollowUp && this.lastContext.negeri) fNegeri = this.lastContext.negeri;
            if (!fDaerah && !isFollowUp && this.lastContext.daerah) fDaerah = this.lastContext.daerah;
            if (!fKategori && !isFollowUp && this.lastContext.kategori) fKategori = this.lastContext.kategori;
            if (!fCrop && !isFollowUp && this.lastContext.crop) fCrop = this.lastContext.crop;
            if (!fPestSearch && !isFollowUp && this.lastContext.pest) { 
                fPestSearch = this.lastContext.pest.search; 
                fPestDisplayName = this.lastContext.pest.display; 
            }
        }

        // SIMPAN KE MEMORI BARU
        this.lastContext = { 
            negeri: fNegeri, 
            daerah: fDaerah, 
            kategori: fKategori, 
            crop: fCrop, 
            pest: fPestSearch ? {search: fPestSearch, display: fPestDisplayName} : null 
        };

        // 3. INTENT CLASSIFICATION (BACA NIAT SOALAN)
        let isSummary = /rumusan|ringkas|status|statistik|jumlah|berapa|luas|bancian|hektar|data|maklumat|info|overview|keseluruhan|semua|report/i.test(query);
        let isTopPest = /top|tinggi|teruk|utama|perosak|ancaman|bahaya|serang|masalah|kritikal|popular/i.test(query);
        let isLocation = /mana|lokasi|tempat|senarai\s*kawasan|jejak|daerah|negeri|dijumpai|ditemui|ada\s*di/i.test(query);
        let isTopCrop = /tanaman|pokok|komoditi|jenis\s*tanaman|ditanam|terlibat/i.test(query);
        let isCompare = /beza|banding|vs\b|(?<!versi)lawan\b|antara\s(.+?)\sdan\s(.+)/i.test(query);
        let isHelp = /help|bantuan|tolong|contoh|cara\s*guna|apa\s*boleh|boleh\s*tanya/i.test(query);

        // BINA TAG FILTER UI
        let filterTags = [];
        if(fDaerah) filterTags.push(`📍 ${fDaerah}`);
        if(fNegeri) filterTags.push(`🏛️ ${fNegeri}`);
        if(fCrop) filterTags.push(`🌱 ${fCrop}`);
        if(fKategori && !fCrop) filterTags.push(`📂 ${fKategori}`);
        let tagHtml = filterTags.length > 0 ? 
            `<div class="mb-3"><span class="badge bg-primary bg-opacity-10 text-primary border border-primary px-2 py-1"><i class="bi bi-funnel-fill"></i> Konteks: ${filterTags.join(" | ")}</span></div>` : 
            `<div class="mb-3"><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-2 py-1"><i class="bi bi-globe"></i> Konteks: Nasional</span></div>`;

        // Jika minta bantuan
        if (isHelp) {
            return `<div class="text-start">${tagHtml}
            <div class="bg-light p-3 rounded border mb-2">
            <i class="bi bi-info-circle text-primary"></i> <b>Contoh soalan yang boleh ditanya:</b><br><br>
            ${this.getContohSoalan(db)}
            </div>
            <small class="text-muted">💡 <b>Petua:</b> Guna perkataan seperti "negeri", "daerah", atau nama tanaman/perosak untuk hasil lebih tepat. Taip "nasional" untuk reset konteks.</small></div>`;
        }

        // 4. PENGIRAAN ASAS UNTUK KONTEKS INI
        let masterLuasTanam = 0, masterLuasSerang = 0, masterCount = 0;
        db.forEach(d => {
            let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop.toUpperCase());
            if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri.toUpperCase())) && 
               (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah.toUpperCase())) && 
               (!fKategori || (d.kt||"").toUpperCase().includes(fKategori.toUpperCase())) && 
               matchCrop) {
                masterLuasTanam += (parseFloat(d.lt)||0);
                masterLuasSerang += (parseFloat(d.ls)||0);
                masterCount++;
            }
        });

        // Jika langsung tiada data
        if (masterLuasTanam === 0 && masterCount === 0) {
            return `${tagHtml}
            <div class="bg-warning bg-opacity-10 p-2 rounded border border-warning mb-2">
            <i class="bi bi-exclamation-triangle text-warning"></i> ✅ Tiada sebarang data bancian mahupun serangan ditemui untuk konteks ini.
            </div>
            <small class="text-muted">💡 Cuba taip "nasional" untuk lihat keseluruhan data atau "help" untuk contoh soalan.</small>`;
        }

        // AUTO-DASHBOARD (Jika soalan umum)
        let hasSpecificIntent = isSummary || isTopPest || isLocation || isTopCrop || isCompare || fPestSearch;
        if (!hasSpecificIntent) {
            isSummary = true;
            if (masterLuasSerang > 0) isTopPest = true;
        }

        let htmlResponse = tagHtml;

        // --- BLOK: PERBANDINGAN ---
        if (isCompare) {
            let entities = query.match(/(?:beza|banding|vs|lawan|antara)\s+(.+?)\s+(?:dan|vs|lawan)\s+(.+)/i);
            let ent1 = null, ent2 = null;
            
            if (entities) {
                ent1 = entities[1].trim();
                ent2 = entities[2].trim();
            } else {
                // Cuba split dengan "dan"
                let parts = query.split(/\s+dan\s+/);
                if (parts.length >= 2) {
                    ent1 = parts[0].replace(/(beza|banding|vs|lawan|antara)\s*/i, '').trim();
                    ent2 = parts[1].trim();
                }
            }
            
            if (ent1 && ent2) {
                let calcStats = function(namaEntiti) {
                    let lt = 0, ls = 0;
                    db.forEach(d => {
                        let matchNegeri = (d.n||"").toUpperCase().includes(namaEntiti.toUpperCase());
                        let matchDaerah = (d.d||"").toUpperCase().includes(namaEntiti.toUpperCase());
                        let matchCrop = (d.tn||"").toUpperCase().includes(namaEntiti.toUpperCase());
                        if (matchNegeri || matchDaerah || matchCrop) {
                            lt += (parseFloat(d.lt)||0);
                            ls += (parseFloat(d.ls)||0);
                        }
                    });
                    return { lt, ls, pct: lt > 0 ? ((ls/lt)*100).toFixed(2) : 0 };
                };
                
                let stat1 = calcStats(ent1);
                let stat2 = calcStats(ent2);
                
                if (stat1.lt > 0 || stat2.lt > 0) {
                    let bandingan = stat2.lt > 0 ? ((stat1.ls - stat2.ls) / stat2.lt * 100).toFixed(1) : 0;
                    let lebihTinggi = stat1.ls > stat2.ls ? ent1.toUpperCase() : ent2.toUpperCase();
                    
                    htmlResponse += `<div class="bg-light p-3 rounded border mb-2">
                    <i class="bi bi-bar-chart-fill text-primary"></i> <b>Perbandingan: ${ent1.toUpperCase()} lwn ${ent2.toUpperCase()}</b>
                    <table class="table table-sm table-borderless mt-2 mb-0" style="font-size:0.8rem;">
                    <tr><td width="40%">${ent1.toUpperCase()}</td><td><b>${stat1.lt.toLocaleString()} Ha</b> (Bancian)</td><td class="${stat1.pct>5?'text-danger':'text-warning'}"><b>${stat1.ls.toLocaleString()} Ha</b> (${stat1.pct}%)</td></tr>
                    <tr><td>${ent2.toUpperCase()}</td><td><b>${stat2.lt.toLocaleString()} Ha</b> (Bancian)</td><td class="${stat2.pct>5?'text-danger':'text-warning'}"><b>${stat2.ls.toLocaleString()} Ha</b> (${stat2.pct}%)</td></tr>
                    </table>
                    <small class="text-muted">📊 ${lebihTinggi} mencatatkan serangan lebih tinggi (beza ~${Math.abs(bandingan).toFixed(1)}%)</small>
                    </div>`;
                } else {
                    htmlResponse += `<i class="bi bi-info-circle"></i> Data tidak mencukupi untuk perbandingan.`;
                }
                return htmlResponse;
            }
        }

        // --- BLOK: RUMUSAN ---
        if (isSummary) {
            let pct = masterLuasTanam > 0 ? ((masterLuasSerang/masterLuasTanam)*100).toFixed(2) : 0;
            let severity = pct > 10 ? 'bahaya' : (pct > 5 ? 'sederhana' : 'rendah');
            let severityIcon = pct > 10 ? '🔴' : (pct > 5 ? '🟡' : '🟢');
            
            htmlResponse += `<div class="bg-light p-3 rounded border mb-2" style="font-size:0.85rem;">
            <i class="bi bi-graph-up text-primary"></i> <b>Rumusan Keluasan:</b><br>
            <div class="row mt-1">
            <div class="col-6"><small>📋 Bancian:</small><br><b>${masterLuasTanam.toLocaleString()} Ha</b></div>
            <div class="col-6"><small>⚠️ Serangan:</small><br><b class="${pct>5?'text-danger':'text-warning'}">${masterLuasSerang.toLocaleString()} Ha</b> (${pct}%)</div>
            </div>
            <div class="mt-1"><small>Tahap: ${severityIcon} <b>${severity.toUpperCase()}</b></small></div>
            </div>`;
        }

        // --- PENYELAMAT KAWASAN SELAMAT (ZERO ATTACK) ---
        if (masterLuasSerang === 0 && !fPestSearch) {
            if (!isSummary) { 
                htmlResponse += `<div class="bg-light p-2 rounded border mb-2" style="font-size:0.85rem;">
                📊 <b>Rumusan Keluasan:</b><br>• Bancian: <b>${masterLuasTanam.toLocaleString()} Ha</b><br>• Serangan: <b class="text-success">0 Ha</b> (0%)</div>`;
            }
            htmlResponse += `<div class="bg-success bg-opacity-10 p-2 rounded border border-success mt-2">
            ✅ Alhamdulillah, <b>tiada sebarang serangan perosak</b> direkodkan bagi kawasan ini. Tanaman selamat.</div>`;
            return htmlResponse;
        }

        // --- BLOK: SENARAI TANAMAN TERLIBAT ---
        if (isTopCrop) {
            let kumpulTanam = {};
            db.forEach(d => {
                let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop.toUpperCase());
                if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri.toUpperCase())) && 
                   (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah.toUpperCase())) && 
                   (!fKategori || (d.kt||"").toUpperCase().includes(fKategori.toUpperCase())) && 
                   matchCrop) {
                    let ls = parseFloat(d.ls) || 0;
                    if(ls > 0) kumpulTanam[d.tn] = (kumpulTanam[d.tn] || 0) + ls;
                }
            });
            let sortTanam = Object.entries(kumpulTanam).sort((a,b) => b[1] - a[1]);
            if(sortTanam.length > 0) {
                htmlResponse += `<div class="mb-2 mt-2">🌾 <b>Tanaman Terjejas (Top ${Math.min(5, sortTanam.length)}):</b></div>`;
                sortTanam.slice(0, 5).forEach((x, i) => {
                    let pct = masterLuasTanam > 0 ? ((x[1]/masterLuasTanam)*100).toFixed(1) : 0;
                    let barWidth = Math.min(100, Math.max(5, (pct * 8)));
                    htmlResponse += `<div class="mb-1" style="font-size:0.8rem;">
                    <div class="d-flex justify-content-between"><span>${i+1}. ${x[0]}</span> <span><b>${x[1].toFixed(2)} Ha</b> <small class="${pct>5?'text-danger':'text-warning'}">(${pct}%)</small></span></div>
                    <div class="progress" style="height:4px;"><div class="progress-bar ${pct>10?'bg-danger':(pct>5?'bg-warning':'bg-success')}" style="width:${barWidth}%"></div></div>
                    </div>`;
                });
            }
        }

        // --- BLOK: TOP PEROSAK KESELURUHAN ---
        if (isTopPest && !fPestSearch) {
            let kumpul = {};
            db.forEach(d => {
                let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop.toUpperCase());
                if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri.toUpperCase())) && 
                   (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah.toUpperCase())) && 
                   matchCrop && 
                   (!fKategori || (d.kt||"").toUpperCase().includes(fKategori.toUpperCase()))) {
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
                htmlResponse += `<div class="mb-2 mt-2">🔥 <b>Ancaman Tertinggi (Top ${Math.min(5, sortPest.length)}):</b></div>`;
                sortPest.slice(0, 5).forEach((x, i) => {
                    let pct = masterLuasTanam > 0 ? ((x[1]/masterLuasTanam)*100).toFixed(1) : 0;
                    let barWidth = Math.min(100, Math.max(5, (pct * 8)));
                    htmlResponse += `<div class="mb-1" style="font-size:0.8rem;">
                    <div class="d-flex justify-content-between"><span>${i+1}. ${x[0]}</span> <span><b>${x[1].toFixed(2)} Ha</b> <small class="${pct>5?'text-danger':'text-warning'}">(${pct}%)</small></span></div>
                    <div class="progress" style="height:4px;"><div class="progress-bar ${pct>10?'bg-danger':(pct>5?'bg-warning':'bg-success')}" style="width:${barWidth}%"></div></div>
                    </div>`;
                });
            }
        }

        // --- BLOK: TOP LOKASI (ATAU JEJAK PEROSAK SPESIFIK) ---
        if (isLocation || fPestSearch) {
            let locList = [];
            db.forEach(d => {
                let matchCrop = !fCrop || (d.tn||"").toUpperCase().includes(fCrop.toUpperCase());
                if((!fNegeri || (d.n||"").toUpperCase().includes(fNegeri.toUpperCase())) && 
                   (!fDaerah || (d.d||"").toUpperCase().includes(fDaerah.toUpperCase())) && 
                   matchCrop && 
                   (!fKategori || (d.kt||"").toUpperCase().includes(fKategori.toUpperCase()))) {
                    
                    let luasAtt = 0;
                    if(fPestSearch) { 
                        let pObj = this.getPestObj(d.p);
                        if (pObj) {
                            let matchKey = Object.keys(pObj).find(dbKey => 
                                fPestSearch.some(synonym => dbKey.toUpperCase().includes(synonym.toUpperCase()))
                            );
                            if(matchKey) luasAtt = parseFloat(pObj[matchKey]) || 0;
                        }
                    } else {
                        luasAtt = parseFloat(d.ls) || 0;
                    }

                    if(luasAtt > 0) locList.push({ 
                        lok: d.l, 
                        daerah: d.d, 
                        neg: d.n, 
                        tanam: d.tn, 
                        luasTanam: parseFloat(d.lt)||0, 
                        luasSerang: luasAtt 
                    });
                }
            });
            locList.sort((a,b) => b.luasSerang - a.luasSerang);
            if(locList.length > 0) {
                let tajuk = fPestSearch ? 
                    `📍 <b>Kawasan Diserang ${fPestDisplayName} (Top ${Math.min(5, locList.length)}):</b>` : 
                    `📍 <b>Kawasan Terjejas Teruk (Top ${Math.min(5, locList.length)}):</b>`;
                htmlResponse += `<div class="mt-2">${tajuk}</div>`;
                
                locList.slice(0, 5).forEach((x, i) => {
                    let pct = x.luasTanam > 0 ? ((x.luasSerang/x.luasTanam)*100).toFixed(1) : 0;
                    let severityColor = pct > 10 ? '#dc3545' : (pct > 5 ? '#ffc107' : '#198754');
                    let severityBg = pct > 10 ? 'rgba(220,53,69,0.1)' : (pct > 5 ? 'rgba(255,193,7,0.1)' : 'rgba(25,135,84,0.1)');
                    htmlResponse += `<div class="mb-2 p-2 rounded" style="font-size:0.8rem; border-left: 3px solid ${severityColor}; background: ${severityBg};">
                    <b>${i+1}. ${x.lok}</b> (${x.daerah||x.neg})<br>
                    <span class="text-muted">🌱 ${x.tanam} | ⚠️ <b>${x.luasSerang.toFixed(2)} Ha</b> <span class="fw-bold" style="color:${severityColor};">(${pct}%)</span></span>
                    </div>`;
                });
                
                if (locList.length > 5) {
                    htmlResponse += `<small class="text-muted">...dan ${locList.length - 5} lagi kawasan lain</small><br>`;
                }
            } else if (fPestSearch) {
                htmlResponse += `<div class="bg-success bg-opacity-10 p-2 rounded border border-success mt-2">
                ✅ Tiada serangan aktif bagi <b>${fPestDisplayName}</b> ditemui dalam kawasan ini.</div>`;
            }
        }

        // Fallback jika tiada intent yang match
        if (!isSummary && !isTopPest && !isLocation && !isTopCrop && !isCompare && !fPestSearch && !isHelp) {
            htmlResponse += `<div class="mt-2">
            <i class="bi bi-question-circle text-secondary"></i> 🤔 Saya tidak pasti dengan maksud soalan itu.<br><br>
            <div class="bg-light p-2 rounded border">
            <small class="fw-bold">📌 Cuba tanya:</small><br>
            <small>${this.getContohSoalan(db)}</small>
            </div>
            <small class="text-muted mt-1">💡 Taip "help" untuk lebih banyak contoh.</small></div>`;
        }

        return htmlResponse;
    }
};
