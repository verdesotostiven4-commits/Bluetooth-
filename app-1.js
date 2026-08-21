const devices = [
      {name:'AirPods Pro #6', type:'headphones', open:'airpods'},
      {name:'CS-4405', type:'device'},
      {name:'HAVIT SH002', type:'headphones'},
      {name:'ITALY AUDIO', type:'device'},
      {name:'LD-S650', type:'headphones'},
      {name:'Leito', type:'device'},
      {name:'Redmi Watch 5 Lite 35DF', type:'watch'}
    ];

    const points = {
      1:{title:'Punto 1',detail:'Zona habitual · ubicación aproximada',lat:-0.7359746,lng:-90.3149782,acc:86},
      2:{title:'Punto 2',detail:'Detección nocturna · ubicación aproximada',lat:-0.736017,lng:-90.3218,acc:100},
      3:{title:'Punto 3',detail:'Última señal disponible · sin conexión directa',lat:-0.735458,lng:-90.314636,acc:120}
    };

    const detections = [
      {date:'2026-08-16',label:'Dom',sub:'16 ago.',time:'22:55',point:2,status:'Detección nocturna · ubicación aproximada',ago:'hace 4 d'},
      {date:'2026-08-17',label:'Lun',sub:'17 ago.',time:'23:12',point:2,status:'Detección nocturna · ubicación aproximada',ago:'hace 3 d'},
      {date:'2026-08-18',label:'Mar',sub:'18 ago.',time:'10:18',point:1,status:'Conexión diurna · ubicación aproximada',ago:'hace 2 d'},
      {date:'2026-08-19',label:'Mié',sub:'19 ago.',time:'23:44',point:3,status:'Señal detectada · sin conexión directa',ago:'hace 13 h'},
      {date:'2026-08-20',label:'Hoy',sub:'20 ago.',time:'15:31',point:3,status:'Última señal disponible · sin conexión directa',ago:'hace 3 h',current:true}
    ];

    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const screens = {bluetooth:$('#screenBluetooth'), airpods:$('#screenAirpods'), find:$('#screenFind')};
    const toast = $('#toast');
    let currentScreen='bluetooth';
    let selected = detections.find(d=>d.current) || detections[detections.length-1];
    let map, roadLayer, darkLayer, activeLayer, markers={}, circles={}, mapDark=false;
    let sheetState='mid';
    let userLatLng=null, userMarker=null, userAccuracyCircle=null, routeLayer=null;

    function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(()=>toast.classList.remove('show'), 1700); }

    function icon(type){
      if(type==='headphones') return '<svg viewBox="0 0 24 24"><use href="#i-headphones"></use></svg>';
      if(type==='watch') return '<svg viewBox="0 0 24 24"><use href="#i-watch"></use></svg>';
      return '<svg viewBox="0 0 24 24"><use href="#i-device"></use></svg>';
    }

    function renderDevices(){
      $('#deviceList').innerHTML = devices.map(d=>`<button class="card device-item" ${d.open==='airpods'?'data-open="airpods"':''}>
        <div class="device-icon">${icon(d.type)}</div>
        <div class="device-copy"><b>${d.name}</b><small>Guardado</small></div>
        <div class="tail"><i class="chev"></i></div>
      </button>`).join('');
      $$('[data-open="airpods"]').forEach(el=>el.addEventListener('click',()=>go('airpods')));
    }

    function go(name){
      Object.values(screens).forEach(s=>s.classList.remove('active'));
      screens[name].classList.add('active');
      currentScreen=name;
      if(name==='airpods'){
        screens.airpods.classList.remove('reveal');
        void screens.airpods.offsetWidth;
        requestAnimationFrame(()=>screens.airpods.classList.add('reveal'));
      }
      if(name==='find') startFind();
      else clearRoute();
    }

    function renderDays(){
      const strip = $('#dayStrip');
      strip.innerHTML = detections.map(d=>`<button class="day ${d===selected?'active':''}" data-date="${d.date}"><strong>${d.label}</strong><span>${d.sub}</span></button>`).join('');
      $$('#dayStrip .day').forEach(btn=>btn.addEventListener('click',()=>{
        const d = detections.find(x=>x.date===btn.dataset.date); if(!d) return; selectDetection(d, true);
      }));
    }

    function renderTimeline(){
      $('#timeline').innerHTML = detections.map(d=>`<div class="event"><strong>${points[d.point].title} · ${d.label} ${d.sub} · ${d.time}</strong><small>${d.status}</small></div>`).join('');
    }

    function selectDetection(d, fly){
      selected = d;
      clearRoute();
      $('#lastSeen').textContent = `${friendlyDate(d)} · ${points[d.point].title}`;
      $('#pointTitle').textContent = points[d.point].title;
      $('#pointDetail').textContent = points[d.point].detail;
      $('#pointAgo').textContent = d.ago;
      $('#headerSubtitle').textContent = d.status;
      renderDays();
      updateMarkers();
      if(fly && map){ centerSelected(true); }
    }

    function friendlyDate(d){ return `${d.label==='Hoy'?'Jueves 20':(d.label+' '+d.sub)} , ${d.time}`.replace(' ,', ','); }

    function preferredZoom(){ return window.innerWidth < 450 ? 17 : 16; }
