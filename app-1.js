const DEVICES=[
{name:'AirPods Pro #6',icon:'headphones',target:'airpods'},
{name:'CS-4405',icon:'device'},
{name:'HAVIT SH002',icon:'headphones'},
{name:'ITALY AUDIO',icon:'device'},
{name:'LD-S650',icon:'headphones'},
{name:'Leito',icon:'device'},
{name:'Redmi Watch 5 Lite 35DF',icon:'watch'}
];

const DETECTIONS=[
{date:'2026-08-16',day:'Domingo 16',short:'Dom',time:'11:18',point:1,note:'Ubicación aproximada detectada por la red'},
{date:'2026-08-16',day:'Domingo 16',short:'Dom',time:'17:46',point:1,note:'Nueva señal en la misma zona'},
{date:'2026-08-16',day:'Domingo 16',short:'Dom',time:'22:53',point:2,note:'Detección nocturna · ubicación aproximada'},
{date:'2026-08-17',day:'Lunes 17',short:'Lun',time:'10:06',point:1,note:'Ubicación aproximada detectada por la red'},
{date:'2026-08-17',day:'Lunes 17',short:'Lun',time:'16:37',point:1,note:'Nueva señal en la misma zona'},
{date:'2026-08-17',day:'Lunes 17',short:'Lun',time:'23:12',point:2,note:'Detección nocturna · ubicación aproximada'},
{date:'2026-08-18',day:'Martes 18',short:'Mar',time:'09:24',point:1,note:'Última detección registrada en esta zona'},
{date:'2026-08-18',day:'Martes 18',short:'Mar',time:'21:47',point:3,note:'Primera señal registrada en una zona diferente'},
{date:'2026-08-19',day:'Miércoles 19',short:'Mié',time:'08:12',point:3,note:'Señal recibida · sin conexión directa'},
{date:'2026-08-19',day:'Miércoles 19',short:'Mié',time:'14:38',point:3,note:'Ubicación aproximada sin cambios relevantes'},
{date:'2026-08-19',day:'Miércoles 19',short:'Mié',time:'23:06',point:3,note:'Nueva señal en la misma zona'},
{date:'2026-08-20',day:'Jueves 20',short:'Hoy',time:'06:52',point:3,note:'Ubicación aproximada sin cambios relevantes'},
{date:'2026-08-20',day:'Jueves 20',short:'Hoy',time:'15:31',point:3,note:'Última señal disponible · sin conexión directa',current:true}
];

// The exact presentation coordinates are imported into localStorage. These fallbacks
// are deliberately generic so private locations are not published in the repository.
const DEFAULT_POINTS={
1:{title:'Punto 1',detail:'Zona habitual · ubicación aproximada',lat:-0.742,lng:-90.318,accuracy:85},
2:{title:'Punto 2',detail:'Detección nocturna · ubicación aproximada',lat:-0.746,lng:-90.3225,accuracy:95},
3:{title:'Punto 3',detail:'Última zona detectada · sin conexión directa',lat:-0.739,lng:-90.312,accuracy:115}
};
const STORAGE_KEY='bluetooth-demo-points-v3';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const screens={bluetooth:$('#bluetoothScreen'),airpods:$('#airpodsScreen'),find:$('#findScreen')};
let currentScreen='bluetooth',toastTimer,deferredInstallPrompt=null;
let selectedDetection=DETECTIONS.find(x=>x.current)||DETECTIONS.at(-1),selectedPoint=3,selectedDate='2026-08-20';
let mapZoom=18,mapMode='roadmap',historyOpen=false,points=loadPoints();
let realMap=null,roadLayer=null,satelliteLayer=null,activeBaseLayer=null,leafletPromise=null;
const pointMarkers={},accuracyCircles={};

function clone(v){return JSON.parse(JSON.stringify(v))}
function loadPoints(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return v?{1:{...DEFAULT_POINTS[1],...(v[1]||{})},2:{...DEFAULT_POINTS[2],...(v[2]||{})},3:{...DEFAULT_POINTS[3],...(v[3]||{})}}:clone(DEFAULT_POINTS)}catch{return clone(DEFAULT_POINTS)}}
function savePoints(){localStorage.setItem(STORAGE_KEY,JSON.stringify(points))}
function toast(msg,ms=2100){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),ms)}

function importSetup(){
 if(!location.hash.startsWith('#setup='))return false;
 try{
  const s=location.hash.slice(7).replace(/-/g,'+').replace(/_/g,'/'),padded=s+'='.repeat((4-s.length%4)%4);
  const payload=JSON.parse(decodeURIComponent(escape(atob(padded))));
  const next=clone(DEFAULT_POINTS);
  for(const id of ['1','2','3']){
   const p=payload[id];if(!p||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))throw 0;
   next[id]={...next[id],lat:Number(p.lat),lng:Number(p.lng)};
  }
  points=next;savePoints();history.replaceState({},'',location.pathname+'#find');return true;
 }catch{history.replaceState({},'',location.pathname);return false}
}
const setupImported=importSetup();

function ensureLeaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(leafletPromise)return leafletPromise;
 leafletPromise=new Promise((resolve,reject)=>{
  if(!document.querySelector('link[data-leaflet]')){
   const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';link.dataset.leaflet='1';document.head.appendChild(link);
  }
  const existing=document.querySelector('script[data-leaflet]');
  if(existing){existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',reject,{once:true});return}
  const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.dataset.leaflet='1';script.onload=()=>resolve(window.L);script.onerror=reject;document.head.appendChild(script);
 });
 return leafletPromise;
}

function injectMapUpgrade(){
 const viewport=$('#mapViewport');if(!viewport)return;
 viewport.innerHTML='<div id="leafletMap" class="leaflet-map" aria-label="Mapa interactivo"></div><div id="mapLoading" class="map-loading"><span></span><small>Cargando mapa…</small></div>';
 const style=document.createElement('style');style.textContent=`
 #mapViewport{touch-action:none!important;background:#101416!important;overflow:hidden!important}.leaflet-map{position:absolute;inset:0;z-index:1;background:#101416;touch-action:none!important}.leaflet-container{font-family:inherit;background:#101416}.leaflet-tile-pane{filter:saturate(.92) brightness(.78) contrast(1.06)}#mapViewport.standard .leaflet-tile-pane{filter:saturate(.9) brightness(.82) contrast(1.05)}#mapViewport.satellite .leaflet-tile-pane{filter:saturate(.98) brightness(.8) contrast(1.05)}
 .leaflet-control-attribution{font-size:8px!important;background:rgba(17,19,22,.68)!important;color:#b8bac0!important;padding:2px 5px!important}.leaflet-control-attribution a{color:#d3d5db!important}
 .map-loading{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#11161a;color:#cfd1d6;transition:opacity .25s}.map-loading.hidden{opacity:0;pointer-events:none}.map-loading span{width:32px;height:32px;border:3px solid #333b43;border-top-color:#2f8cff;border-radius:50%;animation:mapSpin .8s linear infinite}@keyframes mapSpin{to{transform:rotate(360deg)}}
 .airpods-map-marker{background:transparent!important;border:0!important}.airpods-map-marker .pin{width:42px;height:42px;border-radius:50%;background:#f7f7f8;color:#121316;border:3px solid #fff;display:grid;place-items:center;font-size:14px;font-weight:800;box-shadow:0 9px 24px rgba(0,0,0,.38);transform:translate(-1px,-1px);transition:.2s}.airpods-map-marker.selected .pin{width:48px;height:48px;background:#fff;box-shadow:0 0 0 10px rgba(47,140,255,.19),0 10px 26px rgba(0,0,0,.45)}.airpods-map-marker.selected .pin:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;background:#2f8cff;bottom:5px;left:50%;transform:translateX(-50%)}
 .find-header{z-index:35!important}.map-tools{z-index:34!important}.find-sheet{z-index:36!important}.route-chip{z-index:37!important}
 .demo-menu-backdrop{position:absolute;inset:0;z-index:130;background:rgba(0,0,0,.6);backdrop-filter:blur(12px);display:grid;place-items:center;padding:22px}.demo-menu-backdrop.hidden{display:none}.demo-menu{width:min(100%,390px);max-height:84dvh;overflow:auto;background:#25262b;border-radius:26px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.5)}.demo-menu h3{margin:0 0 8px;font-size:20px}.demo-menu p{margin:0 0 16px;color:#aaaab2;font-size:13px;line-height:1.45}.demo-menu label{display:block;margin:12px 0}.demo-menu label span{display:block;margin-bottom:6px;font-size:13px;font-weight:600}.demo-menu input{width:100%;border:1px solid rgba(255,255,255,.08);background:#303137;color:white;border-radius:14px;padding:12px 13px;font:inherit}.demo-row{display:flex;gap:9px;margin-top:14px}.demo-btn{flex:1;border-radius:14px!important;padding:12px!important;margin:0!important;text-align:center!important;background:#383a42!important;color:#fff!important}.demo-btn.primary{background:#2f8cff!important}.demo-option{width:100%;display:block;text-align:left!important;background:#303137!important;border-radius:16px!important;padding:14px!important;margin:9px 0!important;color:#fff!important}.demo-option small{display:block;color:#aaaab2;margin-top:4px}
 `;document.head.appendChild(style);
 const host=document.createElement('div');host.innerHTML=`<div id="demoMenu" class="demo-menu-backdrop hidden"><div class="demo-menu"><h3>Opciones del mapa</h3><button id="editPointsBtn" class="demo-option">Editar ubicaciones<small>Configura Punto 1, Punto 2 y Punto 3</small></button><button id="openMapBtn" class="demo-option">Abrir en Google Maps<small>Abre el punto seleccionado en la app de mapas</small></button><button id="closeDemoMenu" class="demo-btn">Cerrar</button></div></div><div id="pointsEditor" class="demo-menu-backdrop hidden"><div class="demo-menu"><h3>Ubicaciones</h3><p>Pega coordenadas en formato lat,lng. Se guardan solo en este dispositivo.</p>${['1','2','3'].map(id=>`<label><span>Punto ${id}</span><input id="point${id}Field" /></label>`).join('')}<div class="demo-row"><button id="savePointsBtn" class="demo-btn primary">Guardar</button><button id="cancelPointsBtn" class="demo-btn">Cancelar</button></div></div></div>`;document.body.appendChild(host);
 ensureLeaflet().then(()=>initRealMap()).catch(()=>{const l=$('#mapLoading');if(l){l.innerHTML='<small>No se pudo cargar el mapa. Revisa tu conexión.</small>'}});
}

function lastDetectionForPoint(id){return [...DETECTIONS].reverse().find(d=>d.point===Number(id))}
function markerIcon(id){
 const selected=Number(id)===Number(selectedPoint);
 return L.divIcon({className:`airpods-map-marker${selected?' selected':''}`,html:`<div class="pin">${id}</div>`,iconSize:[50,50],iconAnchor:[25,25]});
}
function ensurePointLayers(){
 if(!realMap||!window.L)return;
 for(const id of ['1','2','3']){
  const p=points[id];
  if(!pointMarkers[id]){
   accuracyCircles[id]=L.circle([p.lat,p.lng],{radius:p.accuracy||100,color:'#2f8cff',weight:2,opacity:.34,fillColor:'#2f8cff',fillOpacity:.1,interactive:false}).addTo(realMap);
   pointMarkers[id]=L.marker([p.lat,p.lng],{icon:markerIcon(id),riseOnHover:true}).addTo(realMap);
   pointMarkers[id].on('click',()=>{const d=lastDetectionForPoint(id);if(d&&typeof selectDetection==='function')selectDetection(d)});
  }else{
   pointMarkers[id].setLatLng([p.lat,p.lng]);accuracyCircles[id].setLatLng([p.lat,p.lng]);accuracyCircles[id].setRadius(p.accuracy||100);pointMarkers[id].setIcon(markerIcon(id));
  }
 }
}
function switchBaseLayer(){
 if(!realMap)return;
 const wanted=mapMode==='satellite'?satelliteLayer:roadLayer;
 if(activeBaseLayer===wanted)return;
 if(activeBaseLayer&&realMap.hasLayer(activeBaseLayer))realMap.removeLayer(activeBaseLayer);
 activeBaseLayer=wanted;activeBaseLayer.addTo(realMap);
 const v=$('#mapViewport');v.classList.toggle('standard',mapMode==='roadmap');v.classList.toggle('satellite',mapMode==='satellite');
}
function initRealMap(){
 if(realMap||!window.L||!$('#leafletMap'))return;
 const p=points[selectedPoint]||points[3];
 realMap=L.map('leafletMap',{zoomControl:false,attributionControl:true,dragging:true,touchZoom:true,doubleClickZoom:true,scrollWheelZoom:true,boxZoom:false,keyboard:false,zoomAnimation:true,fadeAnimation:true}).setView([p.lat,p.lng],Math.min(mapZoom,19));
 roadLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
 satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'});
 activeBaseLayer=null;switchBaseLayer();ensurePointLayers();
 realMap.on('dragstart',()=>{if(typeof setFindSheetState==='function'){const s=$('#findSheet')?.dataset.sheetState;if(s==='normal'||s==='expanded')setFindSheetState('peek')}});
 realMap.whenReady(()=>setTimeout(()=>{$('#mapLoading')?.classList.add('hidden');realMap.invalidateSize()},90));
}
function updateMap(){
 const p=points[selectedPoint];if(!p)return;
 ensureLeaflet().then(()=>{
  initRealMap();if(!realMap)return;switchBaseLayer();ensurePointLayers();realMap.invalidateSize();const z=Math.min(Math.max(mapZoom,13),19);if(realMap.getZoom()!==z)realMap.setZoom(z,{animate:true});realMap.flyTo([p.lat,p.lng],z,{duration:.6});
 }).catch(()=>{});
}
function openGoogle(p,directions=false){const q=encodeURIComponent(p.lat+','+p.lng),u=directions?`https://www.google.com/maps/dir/?api=1&destination=${q}`:`https://www.google.com/maps/search/?api=1&query=${q}`;window.open(u,'_blank','noopener')}
function relative(d){const now=new Date(),then=new Date(`${d.date}T${d.time}:00-06:00`),mins=Math.max(0,Math.round((now-then)/60000));if(mins<60)return `hace ${mins} min`;const h=Math.round(mins/60);return h<24?`hace ${h} h`:`hace ${Math.round(h/24)} d`}
