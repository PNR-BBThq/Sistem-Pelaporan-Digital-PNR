// ==========================================
// FAIL: js/exports.js
// FUNGSI: Menguruskan Muat Turun (Excel, PDF, KML, GeoJSON)
// ==========================================

const ExportManager = {

    downloadDualExcel: async function() { 
        if (!AppState.fData.length) { alert("Tiada data!"); return; } 
        const workbook = new ExcelJS.Workbook(); 
        const worksheet = workbook.addWorksheet('Laporan Penuh'); 
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 6 }, { header: 'Nama Pegawai', key: 'pg', width: 25 }, 
            { header: 'Tarikh', key: 't', width: 12 }, { header: 'Negeri', key: 'n', width: 15 }, 
            { header: 'Daerah', key: 'd', width: 15 }, { header: 'Lokasi', key: 'l', width: 22 }, 
            { header: 'Koordinat', key: 'c', width: 22 }, { header: 'Kategori', key: 'kt', width: 18 }, 
            { header: 'Tanaman', key: 'tn', width: 18 }, { header: 'Luas Bancian (Ha)', key: 'lt', width: 18 }, 
            { header: 'Perosak', key: 'p', width: 20 }, { header: 'Keterukan', key: 'k', width: 15 }, 
            { header: 'Luas Serangan (Ha)', key: 'ls', width: 18 }, { header: '% Serangan', key: 'pct', width: 15 }, 
            { header: 'Syor Kawalan', key: 's', width: 50 }
        ]; 
        
        worksheet.getRow(1).font = { bold: true }; 
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }; 
        let rowIndex = 2; 
        
        AppState.fData.forEach(d => { 
            let pestEntries = (d.p && Object.keys(d.p).length > 0) ? Object.entries(d.p) : [["TIADA", 0]]; 
            let startRow = rowIndex; 
            let luasTanam = parseFloat(d.lt) || 0; 
            
            pestEntries.forEach(([pName, pArea]) => { 
                let luasSerang = parseFloat(pArea) || 0; 
                let pctVal = (luasTanam > 0) ? ((luasSerang / luasTanam) * 100).toFixed(2) + '%' : "0%"; 
                const row = worksheet.getRow(rowIndex); 
                row.values = { id: d.id, pg: d.pg || "-", t: d.t, n: d.n, d: d.d, l: d.l, c: d.c || "-", kt: d.kt || "-", tn: d.tn, lt: luasTanam, p: pName, k: d.k, ls: luasSerang, pct: pctVal, s: d.s }; 
                
                row.eachCell({ includeEmpty: true }, (cell) => { 
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; 
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
                }); 
                rowIndex++; 
            }); 
            
            if (pestEntries.length > 1) { 
                for (let c = 1; c <= 10; c++) { worksheet.mergeCells(startRow, c, rowIndex - 1, c); } 
                worksheet.mergeCells(startRow, 15, rowIndex - 1, 15); 
            } 
        }); 
        
        const buffer = await workbook.xlsx.writeBuffer(); 
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); 
        const url = window.URL.createObjectURL(blob); 
        const anchor = document.createElement('a'); 
        anchor.href = url; anchor.download = 'PNR_Laporan_Lengkap.xlsx'; 
        anchor.click(); window.URL.revokeObjectURL(url); 
    },

    dlPDF: async function() { 
        const btn = document.getElementById('btnDlPDF'); 
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Jana...'; 
        btn.disabled = true; 
        
        let dateLabel = "Terkini"; 
        if (AppState.fData.length > 0) { 
            const sortedDates = AppState.fData.map(d => d.t).sort(); 
            const fmt = (d) => d.split('-').reverse().join('/'); 
            dateLabel = fmt(sortedDates[0]) === fmt(sortedDates[sortedDates.length - 1]) ? fmt(sortedDates[0]) : `${fmt(sortedDates[0])} - ${fmt(sortedDates[sortedDates.length - 1])}`; 
        } 
        
        try { 
            let targetName = document.getElementById('selNegeri') ? document.getElementById('selNegeri').innerText : "SEMUA"; 
            if (AppState.uProf && AppState.uProf.state === "CAMERON HIGHLANDS") { targetName = "PAHANG"; } 
            else if (AppState.uProf && AppState.uProf.state !== "ALL") { targetName = AppState.uProf.state; } 
            
            if (!targetName || targetName === "- Semua -") targetName = "SEMUA"; 
            
            const m = { user: AppState.uProf.name, negeri: targetName, dates: dateLabel }; 
            const r = await API.postData('genPDF', { data: AppState.fData, meta: m }); 
            
            if (r.success) { 
                const a = document.createElement('a'); 
                a.href = "data:application/pdf;base64," + r.base64; 
                a.download = r.filename; a.click(); 
            } else { 
                alert("Gagal menjana PDF: " + r.message); 
            } 
        } catch (e) { 
            console.error(e); 
            alert("Ralat sistem semasa menjana PDF."); 
        } 
        
        btn.innerHTML = originalText; 
        btn.disabled = false; 
    },

    klikJanaPDF: async function(btnElement) {
        if (!navigator.onLine) {
            Swal.fire('Mod Offline', 'Harap maklum, penjanaan PDF memerlukan capaian internet.', 'warning');
            return;
        }

        const lokasiStr = btnElement.getAttribute('data-lokasi');
        const pegawaiStr = btnElement.getAttribute('data-pegawai');
        const coordStr = btnElement.getAttribute('data-coord');      
        const tarikhStr = btnElement.getAttribute('data-tarikh');   

        Swal.fire({
            title: 'Menjana Laporan PDF...',
            html: 'Sila tunggu sebentar. Memproses data & gambar...<br><br><div class="spinner-border text-danger" role="status"></div>',
            showConfirmButton: false,
            allowOutsideClick: false
        });

        try {
            const r = await API.postData('janaPDFBaris', { 
                lokasi: lokasiStr, pegawai: pegawaiStr, coord: coordStr, tarikh: tarikhStr 
            });
            
            if ((r.success || r.status === 'success') && r.base64) {
                const link = document.createElement('a');
                link.href = "data:application/pdf;base64," + r.base64;
                link.download = r.fileName || ("Laporan_" + lokasiStr.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf");
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                Swal.fire({ icon: 'success', title: 'Berjaya!', text: 'Laporan PDF telah disimpan ke dalam peranti anda.', timer: 3000, showConfirmButton: false });
            } else {
                Swal.fire('Ralat', r.message || r.error || 'Gagal memuatkan data PDF.', 'error');
            }
        } catch (err) {
            Swal.fire('Ralat API', 'Gagal berhubung dengan pelayan. Sila cuba lagi.', 'error');
        }
    },

    downloadGeoJSON: function() {
        if (!AppState.fData.length) { alert("Tiada data untuk dimuat turun!"); return; }

        let featuresArray = [];
        AppState.fData.forEach(d => {
            let pestObj = {};
            try { pestObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p; } catch(e) { pestObj = {}; }
            if (!pestObj || Object.keys(pestObj).length === 0) { pestObj = { "Serangan Umum": d.ls }; }

            Object.entries(pestObj).forEach(([pestName, luasSerangPerosak]) => {
                const coord = d.c.split(',').map(Number);
                const luasS = parseFloat(luasSerangPerosak) || 0;
                const luasT = parseFloat(d.lt) || 0;
                const peratus = luasT > 0 ? ((luasS / luasT) * 100).toFixed(2) : 0;
                let sevVal = (d.pk && d.pk[pestName]) ? d.pk[pestName] : (d.k || 0);

                featuresArray.push({
                    "type": "Feature",
                    "geometry": { "type": "Point", "coordinates": [coord[1], coord[0]] },
                    "properties": {
                        "ID": d.id, "Tarikh": d.t, "Negeri": d.n, "Daerah": d.d,
                        "Lokasi": d.l, "Tanaman": d.tn, "Perosak": pestName,          
                        "Luas_Tanam_Ha": luasT, "Luas_Serangan_Ha": luasS,             
                        "Peratus_Serangan": parseFloat(peratus), "Keterukan": "T" + sevVal, "Pegawai": d.pg
                    }
                });
            });
        });

        const geojson = { "type": "FeatureCollection", "features": featuresArray };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "PNR_Data_Spatial_Individu.geojson");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    downloadKML: function() {
        if (!AppState.fData.length) { alert("Tiada data!"); return; }
        
        const colorMap = {
            "JOHOR": "ff0000ff", "KEDAH": "ff00ff00", "KELANTAN": "ff00a5ff",
            "MELAKA": "ffff00ff", "NEGERI SEMBILAN": "ff13458b", "PAHANG": "ff00ffff",
            "PERAK": "ffff0000", "PERLIS": "ff800080", "PULAU PINANG": "ffffff00",
            "SABAH": "ff0080ff", "SARAWAK": "ffcbc0ff", "SELANGOR": "ff000080",
            "TERENGGANU": "ffd0e040", "W.P. KUALA LUMPUR": "ff808080",
            "W.P. LABUAN": "ff008000", "W.P. PUTRAJAYA": "ff8080c0", "HQ / IBU PEJABAT": "ff000000"
        };

        let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n    <name>Laporan Spatial PNR</name>\n`;

        AppState.fData.forEach(d => {
            let pestObj = {};
            try { pestObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p; } catch(e) { pestObj = {}; }
            if (!pestObj || Object.keys(pestObj).length === 0) { pestObj = { "Serangan Umum": d.ls }; }

            Object.entries(pestObj).forEach(([pestName, luasSerangPerosak]) => {
                const coord = d.c.split(',').map(Number);
                const luasS = parseFloat(luasSerangPerosak) || 0;
                const luasT = parseFloat(d.lt) || 0;
                const peratus = luasT > 0 ? ((luasS / luasT) * 100) : 0;
                
                const namaNegeri = (d.n || "").toUpperCase();
                const warna = colorMap[namaNegeri] || "ffffffff";
                const skala = Math.max(0.5, (peratus / 100) * 2.5).toFixed(1);
                let sevVal = (d.pk && d.pk[pestName]) ? d.pk[pestName] : (d.k || 0);

                kml += `
    <Placemark>
        <name><![CDATA[${pestName} - ${d.l}]]></name>
        <description><![CDATA[
            <table border="1" padding="5" style="border-collapse:collapse; font-family:Arial; font-size:12px;">
                <tr><td bgcolor="#f2f2f2"><b>PEROSAK</b></td><td><b>${pestName}</b></td></tr>
                <tr><td bgcolor="#f2f2f2"><b>LOKASI</b></td><td>${d.l}</td></tr>
                <tr><td bgcolor="#f2f2f2"><b>TANAMAN</b></td><td>${d.tn}</td></tr>
                <tr><td bgcolor="#f2f2f2"><b>LUAS TANAM</b></td><td>${luasT.toFixed(2)} Ha</td></tr>
                <tr><td bgcolor="#f2f2f2"><b>LUAS SERANGAN</b></td><td><font color="red">${luasS.toFixed(2)} Ha</font></td></tr>
                <tr><td bgcolor="#f2f2f2"><b>PERATUS</b></td><td><b>${peratus.toFixed(1)}%</b></td></tr>
                <tr><td bgcolor="#f2f2f2"><b>KETERUKAN</b></td><td>Tahap ${sevVal}</td></tr>
                <tr><td bgcolor="#f2f2f2"><b>TARIKH</b></td><td>${d.t}</td></tr>
            </table>
        ]]></description>
        <Style>
            <IconStyle><color>${warna}</color><scale>${skala}</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/shaded_dot.png</href></Icon></IconStyle>
            <LabelStyle><scale>0</scale></LabelStyle>
        </Style>
        <Point><coordinates>${coord[1]},${coord[0]},0</coordinates></Point>
    </Placemark>`;
            });
        });

        kml += `\n</Document></kml>`;
        
        const blob = new Blob([kml], {type: 'application/vnd.google-earth.kml+xml'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "PNR_Data_Perosak.kml";
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    }
};
