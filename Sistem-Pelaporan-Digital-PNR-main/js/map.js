// ==========================================
// FAIL: js/map.js
// FUNGSI: Menguruskan paparan Leaflet Map
// ==========================================

const MapManager = {
    map: null,
    layer: null,

    initMap: function() {
        if (typeof L === 'undefined') {
            document.getElementById('map').innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-muted bg-light">Peta tidak tersedia (Offline)</div>';
            return;
        }

        if (!this.map) {
            try {
                this.map = L.map('map').setView([4.2105, 101.9758], 6);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(this.map);
            } catch(e) { 
                console.log("Ralat memuatkan Leaflet Map"); 
            }
        }
    },

    updateMap: function(pts) {
        if(!this.map) return;
        if(this.layer) this.map.removeLayer(this.layer);
        
        if(pts.length > 0) {
            const markers = pts.map(item => {
                const p = item.coord; 
                const d = item.data; 
                let pestHTML = ""; 
                let pestObj = {}; 
                
                try { 
                    pestObj = typeof d.p === 'string' ? JSON.parse(d.p) : d.p; 
                } catch(e) { pestObj = {}; }
                
                if (pestObj && Object.keys(pestObj).length > 0) { 
                    pestHTML = `<div style="margin-top:5px; border-top:1px dashed #ccc; padding-top:5px;"><small class="fw-bold text-muted">PERINCIAN PEROSAK:</small><ul style="padding-left: 15px; margin-bottom: 0; font-size: 0.8rem;">`; 
                    Object.entries(pestObj).forEach(([nama, luas]) => { 
                        pestHTML += `<li>${nama}: <b class="text-danger">${parseFloat(luas).toFixed(2)} Ha</b></li>`; 
                    }); 
                    pestHTML += `</ul></div>`; 
                } else { 
                    pestHTML = `<div class="mt-2 text-muted small fst-italic">- Tiada data perosak terperinci -</div>`; 
                }
                
                const popupContent = `
                    <div style="font-family: sans-serif; font-size: 0.85rem; min-width: 200px;">
                        <div style="background-color: #f8f9fa; padding: 5px; border-bottom: 1px solid #ddd; margin-bottom: 5px;">
                            <b class="text-success text-uppercase">${d.tn}</b>
                        </div>
                        <div class="mb-1"><i class="bi bi-geo-alt-fill text-danger"></i> <b>${d.l}</b><br><span class="text-muted small">${d.d}, ${d.n}</span></div>
                        <div class="d-flex justify-content-between bg-light border rounded p-1 mb-2" style="font-size: 0.8rem;">
                            <div><span class="d-block text-muted" style="font-size:0.7rem">LUAS TANAM</span><b>${d.lt.toFixed(2)} Ha</b></div>
                            <div class="text-end border-start ps-2"><span class="d-block text-muted" style="font-size:0.7rem">JUMLAH SERANGAN</span><b class="text-danger">${d.ls.toFixed(2)} Ha</b></div>
                        </div>
                        ${pestHTML}
                        <div class="text-end mt-2"><small class="text-muted" style="font-size: 0.7rem;">Tarikh: ${d.t}</small></div>
                    </div>`;
                
                const marker = L.circleMarker(p, { radius: 6, color: 'white', weight: 1, fillColor: '#dc2626', fillOpacity: 0.8 });
                marker.bindPopup(popupContent); 
                marker.bindTooltip(`<b>${d.tn}</b>: ${d.l}`, { direction: 'top', offset: [0, -5], opacity: 0.9 }); 
                return marker;
            });
            
            this.layer = L.layerGroup(markers).addTo(this.map);
            try { 
                this.map.fitBounds(L.latLngBounds(pts.map(x => x.coord))); 
            } catch(e){}
        }
    }
};
