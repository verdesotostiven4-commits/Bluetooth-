function setFindSheetState(state,animate=true){
 const sheet=$('#findSheet'),handle=$('#sheetHandle');if(!sheet)return;
 const valid=['expanded','normal','peek','hidden'];if(!valid.includes(state))state='normal';
 sheet.dataset.sheetState=state;
 sheet.classList.toggle('expanded',state==='expanded');sheet.classList.toggle('compact',state==='normal');sheet.classList.toggle('sheet-peek',state==='peek');sheet.classList.toggle('sheet-hidden',state==='hidden');sheet.classList.toggle('sheet-dragging',!animate);
 requestAnimationFrame(()=>{
  const h=Math.max(sheet.offsetHeight,220);let y=0;if(state==='peek')y=Math.max(0,h-142);if(state==='hidden')y=h+30;sheet.style.transform=`translate3d(0,${y}px,0)`;
  setTimeout(()=>sheet.classList.remove('sheet-dragging'),20);
 });
 if(handle){handle.setAttribute('aria-label',state==='hidden'?'Mostrar panel':state==='peek'?'Expandir panel':'Bajar panel');handle.title=handle.getAttribute('aria-label')}
 const restore=$('#sheetRestore');if(restore)restore.classList.toggle('visible',state==='hidden');
}

function installFindSheetGestures(){
 const sheet=$('#findSheet'),handle=$('#sheetHandle');if(!sheet||!handle||sheet.dataset.gesturesReady)return;sheet.dataset.gesturesReady='1';
 const summary=$('.device-summary',sheet);
 const style=document.createElement('style');style.textContent=`
 #findSheet{transition:transform .32s cubic-bezier(.2,.8,.2,1),max-height .32s cubic-bezier(.2,.8,.2,1)!important;will-change:transform;overscroll-behavior:contain}
 #findSheet.sheet-dragging{transition:none!important}.sheet-handle{touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;cursor:grab!important;padding-top:8px!important}.sheet-handle i{width:48px!important;height:5px!important;background:#8b8c92!important}.device-summary{touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}
 #findSheet.sheet-peek{max-height:64dvh!important;overflow:hidden!important}#findSheet.sheet-hidden{pointer-events:none!important}#findSheet.sheet-peek .day-strip,#findSheet.sheet-peek .location-card,#findSheet.sheet-peek .find-actions,#findSheet.sheet-peek .history-toggle,#findSheet.sheet-peek .timeline,#findSheet.sheet-peek .map-note{opacity:0;pointer-events:none}
 #sheetRestore{position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));z-index:50;transform:translate(-50%,18px);opacity:0;pointer-events:none;transition:.22s ease;background:rgba(31,33,38,.94);backdrop-filter:blur(18px);border-radius:999px;padding:10px 16px;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:13px;display:flex;align-items:center;gap:8px}#sheetRestore.visible{opacity:1;pointer-events:auto;transform:translate(-50%,0)}#sheetRestore span{display:block;width:19px;height:19px;border-radius:50%;background:#4b4d55;position:relative}#sheetRestore span:before{content:'';position:absolute;left:5px;top:8px;width:7px;height:7px;border-left:2px solid #fff;border-top:2px solid #fff;transform:rotate(45deg)}
 `;document.head.appendChild(style);
 const restore=document.createElement('button');restore.id='sheetRestore';restore.type='button';restore.innerHTML='<span></span>Mostrar AirPods';restore.addEventListener('click',()=>setFindSheetState('normal'));$('#findScreen')?.appendChild(restore);
 setFindSheetState('normal');
 let active=false,pointerId=null,startY=0,startOffset=0,currentOffset=0,moved=false;
 const offsetForState=state=>{const h=Math.max(sheet.offsetHeight,220);if(state==='hidden')return h+30;if(state==='peek')return Math.max(0,h-142);return 0};
 const startDrag=e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;active=true;pointerId=e.pointerId;startY=e.clientY;startOffset=offsetForState(sheet.dataset.sheetState||'normal');currentOffset=startOffset;moved=false;sheet.classList.add('sheet-dragging');sheet.style.transform=`translate3d(0,${startOffset}px,0)`;try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}e.preventDefault();
 };
 [handle,summary].filter(Boolean).forEach(el=>el.addEventListener('pointerdown',startDrag,{passive:false}));
 window.addEventListener('pointermove',e=>{
  if(!active||e.pointerId!==pointerId)return;const dy=e.clientY-startY;if(Math.abs(dy)>5)moved=true;const max=Math.max(sheet.offsetHeight+30,260);currentOffset=Math.max(0,Math.min(max,startOffset+dy));sheet.style.transform=`translate3d(0,${currentOffset}px,0)`;e.preventDefault();
 },{passive:false});
 const finish=e=>{
  if(!active||(e&&e.pointerId!==pointerId))return;const dy=(e?.clientY??startY)-startY,h=Math.max(sheet.offsetHeight,220),peek=Math.max(0,h-142),hidden=h+30;active=false;pointerId=null;sheet.classList.remove('sheet-dragging');let next='normal';
  if(dy<-105)next='expanded';else if(currentOffset>hidden-90||dy>190)next='hidden';else if(currentOffset>Math.max(64,peek-85)||dy>58)next='peek';else if((sheet.dataset.sheetState==='peek'||sheet.dataset.sheetState==='hidden')&&dy<-35)next='normal';else next=sheet.dataset.sheetState==='expanded'?'expanded':'normal';setFindSheetState(next);
 };
 window.addEventListener('pointerup',finish,{passive:true});window.addEventListener('pointercancel',finish,{passive:true});
 handle.addEventListener('click',e=>{if(moved)return;const state=sheet.dataset.sheetState||'normal';setFindSheetState(state==='normal'||state==='expanded'?'peek':'normal')});
}

function bind(){
 injectMapUpgrade();installFindSheetGestures();renderDevices();setHeaders();renderDays();renderTimeline();selectDetection(selectedDetection);
 $('#bluetoothToggle')?.addEventListener('click',e=>{e.currentTarget.classList.toggle('is-on');toast(e.currentTarget.classList.contains('is-on')?'Bluetooth activado':'Bluetooth desactivado')});
 $$('[data-action="go-bluetooth"]').forEach(e=>e.onclick=()=>showScreen('bluetooth'));$$('[data-action="go-airpods"]').forEach(e=>e.onclick=()=>showScreen('airpods'));$$('[data-action="back-home"]').forEach(e=>e.onclick=()=>toast('Ya estás en Bluetooth'));
 $$('.noise-mode').forEach(b=>b.onclick=()=>{$$('.noise-mode').forEach(x=>x.classList.remove('active'));b.classList.add('active')});$$('.interactive-switch').forEach(b=>b.onclick=()=>b.classList.toggle('is-on'));
 $('#findDeviceBtn')?.addEventListener('click',syncFlow);$('#disconnectBtn')?.addEventListener('click',()=>toast('AirPods desconectados'));$('#unpairBtn')?.addEventListener('click',()=>toast('Acción de demostración'));
 $('#recenterBtn')?.addEventListener('click',updateMap);$('#zoomInBtn')?.addEventListener('click',()=>{mapZoom=Math.min(19,mapZoom+1);updateMap()});$('#zoomOutBtn')?.addEventListener('click',()=>{mapZoom=Math.max(13,mapZoom-1);updateMap()});$('#layersBtn')?.addEventListener('click',()=>{mapMode=mapMode==='roadmap'?'satellite':'roadmap';updateMap();toast(mapMode==='satellite'?'Vista satélite':'Vista de mapa')});
 $('#historyToggle')?.addEventListener('click',()=>{historyOpen=!historyOpen;renderTimeline()});
 $('#soundBtn')?.addEventListener('click',()=>toast('Sin conexión directa. Acércate a la última ubicación.',3200));$('#nearbyBtn')?.addEventListener('click',()=>{const o=$('#nearbyOverlay');o?.classList.remove('hidden');const s=$('#nearbyStatus'),x=$('#nearbyText');if(s)s.textContent='Buscando señal…';if(x)x.textContent='Muévete por la zona para intentar establecer una conexión directa.';setTimeout(()=>{if(s)s.textContent='Fuera del alcance';if(x)x.textContent='Solo hay una ubicación aproximada reciente.'},1700)});$('#closeNearby')?.addEventListener('click',()=>$('#nearbyOverlay')?.classList.add('hidden'));
 $('#directionsBtn')?.addEventListener('click',()=>openGoogle(points[selectedPoint],true));$('#moreFindBtn')?.addEventListener('click',()=>$('#demoMenu').classList.remove('hidden'));
 $('#editPointsBtn')?.addEventListener('click',()=>{$('#demoMenu').classList.add('hidden');fillEditor();$('#pointsEditor').classList.remove('hidden')});$('#openMapBtn')?.addEventListener('click',()=>openGoogle(points[selectedPoint]));$('#closeDemoMenu')?.addEventListener('click',()=>$('#demoMenu').classList.add('hidden'));$('#savePointsBtn')?.addEventListener('click',saveEditor);$('#cancelPointsBtn')?.addEventListener('click',()=>$('#pointsEditor').classList.add('hidden'));
}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('#installBtn')?.classList.remove('hidden')});$('#installBtn')?.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('#installBtn').classList.add('hidden')});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
bind();
if(setupImported){showScreen('find');setTimeout(()=>{toast('Ubicaciones cargadas en este dispositivo');syncFlow()},120)}else if(location.hash==='#airpods')showScreen('airpods');else if(location.hash==='#find')showScreen('find');
