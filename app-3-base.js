async function drawRoute(){
      try{
        if(!userLatLng) await requestUserLocation(false);
        const dest=points[selected.point];
        $('#routeMeta').textContent='Calculando…';
        $('#routeInfo').classList.remove('hidden');
        if(routeLayer){ map.removeLayer(routeLayer); routeLayer=null; }
        const url=`https://router.project-osrm.org/route/v1/driving/${userLatLng.lng},${userLatLng.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        try{
          const r=await fetch(url,{cache:'no-store'});
          if(!r.ok) throw new Error('route');
          const data=await r.json();
          const route=data.routes&&data.routes[0];
          if(!route) throw new Error('route');
          routeLayer=L.geoJSON(route.geometry,{style:{color:'#2f8cff',weight:6,opacity:.92,lineCap:'round',lineJoin:'round'}}).addTo(map);
          const km=route.distance/1000;
          const mins=Math.max(1,Math.round(route.duration/60));
          $('#routeMeta').textContent=`${km<1?Math.round(route.distance)+' m':km.toFixed(1)+' km'} · ${mins} min`;
          const bounds=routeLayer.getBounds().pad(.18);
          map.fitBounds(bounds,{paddingTopLeft:[28,105],paddingBottomRight:[28,Math.min(320,Math.max(150,window.innerHeight-$('#sheet').getBoundingClientRect().top+30))]});
          setSheet('collapsed');
        }catch(e){
          routeLayer=L.polyline([userLatLng,[dest.lat,dest.lng]],{color:'#2f8cff',weight:5,opacity:.88,dashArray:'10 10'}).addTo(map);
          const meters=map.distance(userLatLng,L.latLng(dest.lat,dest.lng));
          $('#routeMeta').textContent=`${meters<1000?Math.round(meters)+' m':(meters/1000).toFixed(1)+' km'} · ruta aproximada`;
          map.fitBounds(routeLayer.getBounds().pad(.22),{padding:[60,90]});
          setSheet('collapsed');
        }
      }catch(e){}
    }

    function setupSheetDrag(){
      const handle = $('#sheetHandle'); const sheet = $('#sheet');
      let startY=0,startTransform=0,current=0,drag=false;
      const getTranslate = ()=>{
        const m = getComputedStyle(sheet).transform;
        if(m === 'none') return 0;
        const vals = m.match(/matrix.*\((.+)\)/)[1].split(', ');
        return parseFloat(vals[5]);
      };
      const onMove = e=>{
        if(!drag) return;
        const y = (e.touches?e.touches[0].clientY:e.clientY);
        const delta = y - startY;
        current = Math.max(0, startTransform + delta);
        sheet.style.transition='none';
        sheet.style.transform = `translateY(${current}px)`;
      };
      const onEnd = ()=>{
        if(!drag) return;
        drag=false;
        sheet.style.transition='';
        const h = sheet.getBoundingClientRect().height;
        if(current > h*0.78) setSheet('hidden');
        else if(current > h*0.48) setSheet('collapsed');
        else if(current > h*0.18) setSheet('mid');
        else setSheet('expanded');
        sheet.style.transform='';
        window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd);
      };
      const start = e=>{
        drag=true;
        startY = (e.touches?e.touches[0].clientY:e.clientY);
        startTransform = getTranslate();
        current = startTransform;
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, {passive:true}); window.addEventListener('touchend', onEnd);
      };
      handle.addEventListener('mousedown', start); handle.addEventListener('touchstart', start, {passive:true});
      $('#showSheetBtn').addEventListener('click', ()=>setSheet('mid'));
    }

    function bind(){
      $('#backBluetooth').onclick = ()=>go('bluetooth');
      $('#backAirpods').onclick = ()=>go('airpods');
      $('#openFind').onclick = ()=>go('find');
      $('#recenter').onclick = ()=>{ if(userLatLng) map.flyTo(userLatLng, Math.max(preferredZoom(),17), {duration:.65}); else requestUserLocation(true); };
      $('#zoomIn').onclick = ()=>map&&map.zoomIn();
      $('#zoomOut').onclick = ()=>map&&map.zoomOut();
      $('#toggleMapStyle').onclick = ()=>{
        if(!map) return; mapDark=!mapDark; map.removeLayer(activeLayer); activeLayer = (mapDark?darkLayer:roadLayer).addTo(map); showToast(mapDark?'Mapa oscuro':'Mapa claro');
      };
      $('#btnDirections').onclick = ()=>drawRoute();
      $('#btnSound').onclick = ()=>showToast('Simulación: reproduciendo sonido');
      $('#btnNearby').onclick = ()=>showToast('Simulación: búsqueda cercana iniciada');
      $('#historyToggle').onclick = ()=>{ $('#timeline').classList.toggle('open'); $('#historyToggle').classList.toggle('open'); setTimeout(()=>map&&map.invalidateSize(), 180); };
      $('#modesWrap').addEventListener('click', e=>{ const btn=e.target.closest('.mode'); if(!btn) return; $$('#modesWrap .mode').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showToast('Modo cambiado'); });
      $$('.switch').forEach(sw=>sw.addEventListener('click', ()=>sw.classList.toggle('on')));
    }

    renderDevices(); renderDays(); renderTimeline(); bind(); setupSheetDrag();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js?v=6').catch(()=>{}));
    }
