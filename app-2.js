function centerSelected(animated=false){
      if(!map) return;
      const p = points[selected.point];
      const z = preferredZoom();
      const latlng = L.latLng(p.lat, p.lng);
      const pt = map.project(latlng, z);
      const sheet = $('#sheet');
      const sheetTop = sheet ? sheet.getBoundingClientRect().top : window.innerHeight;
      const visibleSheet = sheetState==='hidden' ? 0 : Math.max(0, window.innerHeight - sheetTop);
      const headerAllowance = 76;
      const offsetY = Math.max(0, (visibleSheet - headerAllowance) * .48);
      const shifted = map.unproject(L.point(pt.x, pt.y + offsetY), z);
      if(animated) map.flyTo(shifted, z, {duration:.68});
      else map.setView(shifted, z, {animate:false});
    }

    function makeMarker(num, active=false){
      return L.divIcon({className:'', html:`<div class="marker-wrap"><div class="marker-dot ${active?'active':''}">${num}</div></div>`, iconSize:[54,54], iconAnchor:[27,27]});
    }

    function initMap(){
      if(map) return;
      map = L.map('map', {zoomControl:false, attributionControl:false, preferCanvas:true});
      roadLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {subdomains:'abcd', maxZoom:20});
      darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {subdomains:'abcd', maxZoom:20});
      activeLayer = roadLayer.addTo(map);
      updateMarkers();
      map.setView([points[selected.point].lat, points[selected.point].lng], preferredZoom());
      map.on('dragstart zoomstart', ()=>{ if(sheetState==='expanded') setSheet('mid'); });
      window.addEventListener('resize', ()=>setTimeout(()=>{ if(map && currentScreen==='find') centerSelected(false); }, 60));
    }

    function updateMarkers(){
      if(!map) return;
      for(const id of [1,2,3]){
        const p = points[id];
        if(!markers[id]){
          circles[id] = L.circle([p.lat,p.lng], {radius:p.acc, color:'#5aa7ff', weight:2, opacity:.55, fillColor:'#5aa7ff', fillOpacity:.12}).addTo(map);
          markers[id] = L.marker([p.lat,p.lng], {icon:makeMarker(id, selected.point===id)}).addTo(map);
          markers[id].on('click', ()=>{
            const latest = [...detections].reverse().find(x=>x.point===id);
            if(latest) selectDetection(latest, false);
          });
        }
        markers[id].setLatLng([p.lat,p.lng]);
        markers[id].setIcon(makeMarker(id, selected.point===id));
        circles[id].setLatLng([p.lat,p.lng]);
        circles[id].setRadius(p.acc);
      }
    }

    function startFind(){
      initMap();
      $('#syncOverlay').classList.remove('hidden');
      setTimeout(()=>$('#syncOverlay').classList.add('hidden'), 1450);
      selectDetection(selected, true);
      setSheet('mid');
      setTimeout(()=>map.invalidateSize(), 50);
    }

    function setSheet(state){
      sheetState = state;
      const sheet = $('#sheet');
      sheet.classList.remove('expanded','collapsed','hidden-sheet');
      $('#showSheetBtn').classList.remove('show');
      if(state==='expanded') sheet.classList.add('expanded');
      else if(state==='hidden'){ sheet.classList.add('hidden-sheet'); $('#showSheetBtn').classList.add('show'); }
      else if(state==='collapsed') sheet.classList.add('collapsed');
      setTimeout(()=>{ if(map && currentScreen==='find') centerSelected(false); }, 40);
    }

    function showUserLocation(lat, lng, accuracy=20, center=true){
      userLatLng = L.latLng(lat, lng);
      if(!map) return;
      if(!userAccuracyCircle){
        userAccuracyCircle = L.circle(userLatLng,{radius:Math.min(Math.max(accuracy,12),80),color:'#2f8cff',weight:1,opacity:.28,fillColor:'#2f8cff',fillOpacity:.10}).addTo(map);
      }else{
        userAccuracyCircle.setLatLng(userLatLng).setRadius(Math.min(Math.max(accuracy,12),80));
      }
      const icon = L.divIcon({className:'',html:'<div class="user-dot-wrap"><div class="user-dot-ring"></div><div class="user-dot"></div></div>',iconSize:[38,38],iconAnchor:[19,19]});
      if(!userMarker) userMarker=L.marker(userLatLng,{icon,zIndexOffset:1200}).addTo(map);
      else userMarker.setLatLng(userLatLng).setIcon(icon);
      $('#recenter').classList.add('active');
      if(center) map.flyTo(userLatLng, Math.max(preferredZoom(),17), {duration:.65});
    }

    function requestUserLocation(center=true){
      return new Promise((resolve,reject)=>{
        if(!navigator.geolocation){ showToast('Ubicación no disponible en este navegador'); reject(new Error('unsupported')); return; }
        navigator.geolocation.getCurrentPosition(pos=>{
          const {latitude,longitude,accuracy}=pos.coords;
          showUserLocation(latitude,longitude,accuracy,center);
          resolve(L.latLng(latitude,longitude));
        },err=>{
          showToast(err.code===1?'Permite la ubicación para mostrar tu punto':'No se pudo obtener tu ubicación');
          reject(err);
        },{enableHighAccuracy:true,timeout:9000,maximumAge:15000});
      });
    }

    function clearRoute(){
      if(routeLayer && map){ map.removeLayer(routeLayer); routeLayer=null; }
      $('#routeInfo').classList.add('hidden');
    }
