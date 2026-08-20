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

// Fallbacks are intentionally generic. Exact presentation coordinates are imported
// into localStorage through a URL fragment so they are not published in GitHub.
const DEFAULT_POINTS={
1:{title:'Punto 1',detail:'Zona habitual · ubicación aproximada',lat:-0.742,lng:-90.318},
2:{title:'Punto 2',detail:'Detección nocturna · ubicación aproximada',lat:-0.746,lng:-90.3225},
3:{title:'Punto 3',detail:'Última zona detectada · sin conexión directa',lat:-0.739,lng:-90.312}
};
const STORAGE_KEY='bluetooth-demo-points-v3';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const screens={bluetooth:$('#bluetoothScreen'),airpods:$('#airpodsScreen'),find:$('#findScreen')};
let currentScreen='bluetooth', toastTimer, deferredInstallPrompt=null;
let selectedDetection=DETECTIONS.find(x=>x.current)||DETECTIONS.at(-1), selectedPoint=3, selectedDate='2026-08-20';
let mapZoom=18,mapMode='roadmap',historyOpen=false,points=loadPoints();

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
   const p=payload[id]; if(!p||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))throw 0;
   next[id]={...next[id],lat:Number(p.lat),lng:Number(p.lng)};
  }
  points=next;savePoints();history.replaceState({},'',location.pathname+'#find');return true;
 }catch{history.replaceState({},'',location.pathname);return false}
}
const setupImported=importSetup();

function injectMapUpgrade(){
 const viewport=$('#mapViewport'); if(!viewport)return;
 viewport.innerHTML='<iframe id="googleMapFrame" title="Google Maps" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>';
 const style=document.createElement('style');style.textContent=`
 #mapViewport{touch-action:auto!important;background:#111!important}.map-viewport iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#111;filter:saturate(.88) brightness(.78) contrast(1.03)}
 #mapViewport.standard iframe{filter:none}#mapViewport.satellite iframe{filter:saturate(.95) brightness(.84) contrast(1.05)}
 .find-header{z-index:35!important}.map-tools{z-index:34!important}.find-sheet{z-index:36!important}.route-chip{z-index:37!important}
 .demo-menu-backdrop{position:absolute;inset:0;z-index:130;background:rgba(0,0,0,.6);backdrop-filter:blur(12px);display:grid;place-items:center;padding:22px}.demo-menu-backdrop.hidden{display:none}
 .demo-menu{width:min(100%,390px);max-height:84dvh;overflow:auto;background:#25262b;border-radius:26px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.5)}.demo-menu h3{margin:0 0 8px;font-size:20px}.demo-menu p{margin:0 0 16px;color:#aaaab2;font-size:13px;line-height:1.45}
 .demo-menu label{display:block;margin:12px 0}.demo-menu label span{display:block;margin-bottom:6px;font-size:13px;font-weight:600}.demo-menu input{width:100%;border:1px solid rgba(255,255,255,.08);background:#303137;color:white;border-radius:14px;padding:12px 13px;font:inherit}.demo-row{display:flex;gap:9px;margin-top:14px}.demo-btn{flex:1;border-radius:14px!important;padding:12px!important;margin:0!important;text-align:center!important;background:#383a42!important;color:#fff!important}.demo-btn.primary{background:#2f8cff!important}.demo-option{width:100%;display:block;text-align:left!important;background:#303137!important;border-radius:16px!important;padding:14px!important;margin:9px 0!important;color:#fff!important}.demo-option small{display:block;color:#aaaab2;margin-top:4px}
 `;document.head.appendChild(style);
 const host=document.createElement('div');host.innerHTML=`<div id="demoMenu" class="demo-menu-backdrop hidden"><div class="demo-menu"><h3>Opciones del mapa</h3><button id="editPointsBtn" class="demo-option">Editar ubicaciones<small>Configura Punto 1, Punto 2 y Punto 3</small></button><button id="openMapBtn" class="demo-option">Abrir en Google Maps<small>Abre el punto seleccionado en la app de mapas</small></button><button id="closeDemoMenu" class="demo-btn">Cerrar</button></div></div><div id="pointsEditor" class="demo-menu-backdrop hidden"><div class="demo-menu"><h3>Ubicaciones</h3><p>Pega coordenadas en formato lat,lng. Se guardan solo en este dispositivo.</p>${['1','2','3'].map(id=>`<label><span>Punto ${id}</span><input id="point${id}Field" /></label>`).join('')}<div class="demo-row"><button id="savePointsBtn" class="demo-btn primary">Guardar</button><button id="cancelPointsBtn" class="demo-btn">Cancelar</button></div></div></div>`;
 document.body.appendChild(host);
}

function googleUrl(p){const t=mapMode==='satellite'?'k':'m';return `https://maps.google.com/maps?q=${encodeURIComponent(p.lat+','+p.lng)}&z=${mapZoom}&t=${t}&output=embed`}
function updateMap(){const f=$('#googleMapFrame'),p=points[selectedPoint];if(!f||!p)return;f.src=googleUrl(p);const v=$('#mapViewport');v.classList.toggle('standard',mapMode==='roadmap');v.classList.toggle('satellite',mapMode==='satellite')}
function openGoogle(p,directions=false){const q=encodeURIComponent(p.lat+','+p.lng),u=directions?`https://www.google.com/maps/dir/?api=1&destination=${q}`:`https://www.google.com/maps/search/?api=1&query=${q}`;window.open(u,'_blank','noopener')}
function relative(d){const now=new Date(),then=new Date(`${d.date}T${d.time}:00-06:00`),mins=Math.max(0,Math.round((now-then)/60000));if(mins<60)return `hace ${mins} min`;const h=Math.round(mins/60);return h<24?`hace ${h} h`:`hace ${Math.round(h/24)} d`}

