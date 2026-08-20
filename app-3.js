function setFindSheetState(state,animate=true){
 const sheet=$('#findSheet'),handle=$('#sheetHandle');if(!sheet)return;
 const valid=['expanded','normal','peek','hidden'];if(!valid.includes(state))state='normal';
 sheet.dataset.sheetState=state;
 sheet.classList.toggle('expanded',state==='expanded');
 sheet.classList.toggle('compact',state==='normal');
 sheet.classList.toggle('sheet-peek',state==='peek');
 sheet.classList.toggle('sheet-hidden',state==='hidden');
 sheet.classList.toggle('sheet-dragging',!animate);
 sheet.style.transform='';
 if(handle){handle.setAttribute('aria-label',state==='hidden'?'Mostrar panel':state==='peek'?'Expandir panel':'Bajar panel');handle.title=handle.getAttribute('aria-label')}
 const restore=$('#sheetRestore');if(restore)restore.classList.toggle('visible',state==='hidden');
 setTimeout(()=>sheet.classList.remove('sheet-dragging'),20);
}

function installFindSheetGestures(){
 const sheet=$('#findSheet'),handle=$('#sheetHandle');if(!sheet||!handle||sheet.dataset.gesturesReady)return;
 sheet.dataset.gesturesReady='1';
 const style=document.createElement('style');style.textContent=`
 #findSheet{transition:transform .32s cubic-bezier(.2,.8,.2,1),max-height .32s cubic-bezier(.2,.8,.2,1)!important;will-change:transform;touch-action:pan-y}
 #findSheet.sheet-dragging{transition:none!important}
 #findSheet.sheet-peek{transform:translateY(calc(100% - 132px))!important;max-height:68dvh!important;overflow:hidden!important}
 #findSheet.sheet-hidden{transform:translateY(calc(100% - 42px))!important;max-height:68dvh!important;overflow:hidden!important}
 #findSheet.sheet-peek .sheet-handle,#findSheet.sheet-hidden .sheet-handle{padding-bottom:10px!important}
 #findSheet.sheet-hidden .sheet-handle i{width:52px!important;background:#9a9aa1!important}
 #findSheet.sheet-peek .device-summary{pointer-events:none}
 #sheetRestore{position:absolute;left:50%;bottom:12px;z-index:37;transform:translate(-50%,18px);opacity:0;pointer-events:none;transition:.22s ease;background:rgba(31,33,38,.92);backdrop-filter:blur(18px);border-radius:999px;padding:9px 14px;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:13px;display:flex;align-items:center;gap:7px}
 #sheetRestore.visible{opacity:1;pointer-events:auto;transform:translate(-50%,0)}
 #sheetRestore span{display:block;width:18px;height:18px;border-radius:50%;background:#4b4d55;position:relative}
 #sheetRestore span:before{content:'';position:absolute;left:5px;top:7px;width:7px;height:7px;border-left:2px solid #fff;border-top:2px solid #fff;transform:rotate(45deg)}
 `;document.head.appendChild(style);
 const restore=document.createElement('button');restore.id='sheetRestore';restore.type='button';restore.innerHTML='<span></span>Mostrar AirPods';restore.addEventListener('click',()=>setFindSheetState('normal'));$('#findScreen')?.appendChild(restore);
 setFindSheetState('normal');
 let dragging=false,startY=0,startTransform=0,lastY=0,lastT=0;
 const translateForState=state=>{const h=sheet.getBoundingClientRect().height;if(state==='hidden')return Math.max(0,h-42);if(state==='peek')return Math.max(0,h-132);return 0};
 const currentTranslate=()=>translateForState(sheet.dataset.sheetState||'normal');
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==undefined&&e.button!==0)return;
  dragging=true;startY=e.clientY;lastY=e.clientY;lastT=performance.now();startTransform=currentTranslate();
  sheet.classList.add('sheet-dragging');sheet.style.transform=`translateY(${startTransform}px)`;
  try{handle.setPointerCapture(e.pointerId)}catch{}
  e.preventDefault();
 });
 handle.addEventListener('pointermove',e=>{
  if(!dragging)return;const dy=e.clientY-startY,h=sheet.getBoundingClientRect().height,max=Math.max(0,h-42);const y=Math.max(0,Math.min(max,startTransform+dy));sheet.style.transform=`translateY(${y}px)`;lastY=e.clientY;lastT=performance.now();e.preventDefault();
 });
 const finish=e=>{
  if(!dragging)return;dragging=false;sheet.classList.remove('sheet-dragging');
  const dy=(e?.clientY??lastY)-startY,h=sheet.getBoundingClientRect().height,max=Math.max(0,h-42);const current=Math.max(0,Math.min(max,startTransform+dy));
  const hiddenY=Math.max(0,h-42),peekY=Math.max(0,h-132);
  let next='normal';
  if(dy<-95)next='expanded';
  else if(current>hiddenY-70||dy>170)next='hidden';
  else if(current>Math.max(70,peekY-65)||dy>55)next='peek';
  else if((sheet.dataset.sheetState==='peek'||sheet.dataset.sheetState==='hidden')&&dy<-25)next='normal';
  else next=sheet.dataset.sheetState==='expanded'?'expanded':'normal';
  setFindSheetState(next);
 };
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 handle.addEventListener('click',e=>{
  if(Math.abs((e.clientY||0)-startY)>8)return;
  const state=sheet.dataset.sheetState||'normal';setFindSheetState(state==='hidden'||state==='peek'?'normal':'peek');
 });
}

function bind(){
 injectMapUpgrade();installFindSheetGestures();renderDevices();setHeaders();renderDays();renderTimeline();selectDetection(selectedDetection);
 $('#bluetoothToggle')?.addEventListener('click',e=>{e.currentTarget.classList.toggle('is-on');toast(e.currentTarget.classList.contains('is-on')?'Bluetooth activado':'Bluetooth desactivado')});
 $$('[data-action="go-bluetooth"]').forEach(e=>e.onclick=()=>showScreen('bluetooth'));$$('[data-action="go-airpods"]').forEach(e=>e.onclick=()=>showScreen('airpods'));$$('[data-action="back-home"]').forEach(e=>e.onclick=()=>toast('Ya estás en Bluetooth'));
 $$('.noise-mode').forEach(b=>b.onclick=()=>{$$('.noise-mode').forEach(x=>x.classList.remove('active'));b.classList.add('active')});$$('.interactive-switch').forEach(b=>b.onclick=()=>b.classList.toggle('is-on'));
 $('#findDeviceBtn')?.addEventListener('click',syncFlow);$('#disconnectBtn')?.addEventListener('click',()=>toast('AirPods desconectados'));$('#unpairBtn')?.addEventListener('click',()=>toast('Acción de demostración'));
 $('#recenterBtn')?.addEventListener('click',updateMap);$('#zoomInBtn')?.addEventListener('click',()=>{mapZoom=Math.min(20,mapZoom+1);updateMap()});$('#zoomOutBtn')?.addEventListener('click',()=>{mapZoom=Math.max(13,mapZoom-1);updateMap()});$('#layersBtn')?.addEventListener('click',()=>{mapMode=mapMode==='roadmap'?'satellite':'roadmap';updateMap();toast(mapMode==='satellite'?'Vista satélite':'Vista de mapa')});
 $('#historyToggle')?.addEventListener('click',()=>{historyOpen=!historyOpen;renderTimeline()});
 $('#soundBtn')?.addEventListener('click',()=>toast('Sin conexión directa. Acércate a la última ubicación.',3200));$('#nearbyBtn')?.addEventListener('click',()=>{const o=$('#nearbyOverlay');o?.classList.remove('hidden');const s=$('#nearbyStatus'),x=$('#nearbyText');if(s)s.textContent='Buscando señal…';if(x)x.textContent='Muévete por la zona para intentar establecer una conexión directa.';setTimeout(()=>{if(s)s.textContent='Fuera del alcance';if(x)x.textContent='Solo hay una ubicación aproximada reciente.'},1700)});$('#closeNearby')?.addEventListener('click',()=>$('#nearbyOverlay')?.classList.add('hidden'));
 $('#directionsBtn')?.addEventListener('click',()=>openGoogle(points[selectedPoint],true));$('#moreFindBtn')?.addEventListener('click',()=>$('#demoMenu').classList.remove('hidden'));
 $('#editPointsBtn')?.addEventListener('click',()=>{$('#demoMenu').classList.add('hidden');fillEditor();$('#pointsEditor').classList.remove('hidden')});$('#openMapBtn')?.addEventListener('click',()=>openGoogle(points[selectedPoint]));$('#closeDemoMenu')?.addEventListener('click',()=>$('#demoMenu').classList.add('hidden'));$('#savePointsBtn')?.addEventListener('click',saveEditor);$('#cancelPointsBtn')?.addEventListener('click',()=>$('#pointsEditor').classList.add('hidden'));
}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('#installBtn')?.classList.remove('hidden')});$('#installBtn')?.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('#installBtn').classList.add('hidden')});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
bind();
if(setupImported){showScreen('find');setTimeout(()=>{toast('Ubicaciones cargadas en este dispositivo');syncFlow()},120)}else if(location.hash==='#airpods')showScreen('airpods');else if(location.hash==='#find')showScreen('find');
