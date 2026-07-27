// ==========================================
// FAIL: js/map.js
// FUNGSI: Menguruskan paparan Leaflet Map (CartoDB Positron, Heatmap & MarkerCluster)
// ==========================================

const MapManager = {
    map: null,
    clusterGroup: null,
    heatLayer: null,

    initMap: function() {
        if (typeof L === 'undefined') {
            const mapEl = document.getElementById('map');
            if (mapEl) mapEl.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-muted bg-light">Peta tidak tersedia (Offline)</div>';
            return;
        }

        if (!this.map) {
            try {
                this.map = L.map('map').setView([4.2105, 101.9758], 6);
                
                // CartoDB Positron tile layer
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    subdomains: 'abcd',
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }).addTo(this.map);
            } catch(e) { 
                console.log("Ralat memuatkan Leaflet Map", e); 
            }
        }
    },

    updateMap: function(pts) {
        if (!this.map) return;

        // Remove existing layers if any
        if (this.clusterGroup) {
            this.map.removeLayer(this.clusterGroup);
            this.clusterGroup = null;
        }
        if (this.heatLayer) {
            this.map.removeLayer(this.heatLayer);
            this.heatLayer = null;
        }

        if (pts && pts.length > 0) {
            // Prepare heatmap data: [lat, lng, intensity] based on Luas Serangan (d.ls)
            let maxLS = 0;
            pts.forEach(item => {
                let ls = item.data ? (parseFloat(item.data.ls) || 0) : 0;
                if (ls > maxLS) maxLS = ls;
            });
            if (maxLS === 0) maxLS = 1;

            const heatPoints = pts.map(item => {
                const p = item.coord;
                const ls = item.data ? (parseFloat(item.data.ls) || 0) : 0;
                // Intensity scaled from 0.3 to 1.0
                const intensity = Math.min(1.0, Math.max(0.3, ls / maxLS));
                return [p[0], p[1], intensity];
            });

            // 1. Heatmap layer (Yellow - Orange - Red gradient)
            if (typeof L.heatLayer === 'function') {
                this.heatLayer = L.heatLayer(heatPoints, {
                    radius: 28,
                    blur: 18,
                    maxZoom: 12,
                    gradient: {
                        0.2: '#fde047', // Yellow
                        0.6: '#f97316', // Orange
                        1.0: '#ef4444'  // Red
                    }
                }).addTo(this.map);
            }

            // 2. Marker Clustering Layer
            let markerContainer = null;
            if (typeof L.markerClusterGroup === 'function') {
                this.clusterGroup = L.markerClusterGroup({
                    maxClusterRadius: 40,
                    spiderfyOnMaxZoom: true,
                    showCoverageOnHover: false,
                    zoomToBoundsOnClick: true
                });
                markerContainer = this.clusterGroup;
            } else {
                this.clusterGroup = L.layerGroup();
                markerContainer = this.clusterGroup;
            }

            pts.forEach(item => {
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
                            <b class="text-success text-uppercase">${d.tn || "Tanaman"}</b>
                        </div>
                        <div class="mb-1"><i class="bi bi-geo-alt-fill text-danger"></i> <b>${d.l || "-"}</b><br><span class="text-muted small">${d.d || "-"}, ${d.n || "-"}</span></div>
                        <div class="d-flex justify-content-between bg-light border rounded p-1 mb-2" style="font-size: 0.8rem;">
                            <div><span class="d-block text-muted" style="font-size:0.7rem">LUAS TANAM</span><b>${(parseFloat(d.lt)||0).toFixed(2)} Ha</b></div>
                            <div class="text-end border-start ps-2"><span class="d-block text-muted" style="font-size:0.7rem">JUMLAH SERANGAN</span><b class="text-danger">${(parseFloat(d.ls)||0).toFixed(2)} Ha</b></div>
                        </div>
                        ${pestHTML}
                        <div class="text-end mt-2"><small class="text-muted" style="font-size: 0.7rem;">Tarikh: ${d.t || "-"}</small></div>
                    </div>`;

                const marker = L.circleMarker(p, {
                    radius: 7,
                    color: '#ffffff',
                    weight: 1.5,
                    fillColor: (parseFloat(d.ls) > 0 ? '#ef4444' : '#10b981'),
                    fillOpacity: 0.9
                });
                marker.bindPopup(popupContent);
                marker.bindTooltip(`<b>${d.tn}</b>: ${d.l}`, { direction: 'top', offset: [0, -5], opacity: 0.9 });
                markerContainer.addLayer(marker);
            });

            this.map.addLayer(markerContainer);

            try {
                this.map.fitBounds(L.latLngBounds(pts.map(x => x.coord)), { padding: [30, 30] });
            } catch(e){}
        }
    }
};
