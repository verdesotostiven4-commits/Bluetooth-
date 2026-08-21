(() => {
  const AIRPODS_IMG = 'https://cdn.phototourl.com/free/2026-08-21-fdff6fa2-4692-47b3-8e93-c137bccbe4b5.png';

  function addStyles() {
    if (document.getElementById('pro-polish-styles')) return;
    const style = document.createElement('style');
    style.id = 'pro-polish-styles';
    style.textContent = `
      .airpods-stage{min-height:330px!important;padding:8px 0 18px!important;display:grid!important;place-items:center!important;position:relative!important;overflow:visible!important}
      .airpods-stage:before{content:"";position:absolute;left:9%;right:9%;top:5%;bottom:5%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.10),rgba(255,255,255,.025) 38%,transparent 72%);filter:blur(18px);pointer-events:none}
      .airpods-stage .airpods-product{display:none!important}
      .airpods-pro-render{position:relative;z-index:2;width:min(86vw,390px);max-height:330px;object-fit:contain;display:block;filter:drop-shadow(0 22px 30px rgba(0,0,0,.42));transform-origin:50% 55%;animation:airpodsEnter .72s cubic-bezier(.16,.88,.26,1) both,airpodsFloat 5.4s ease-in-out .9s infinite;will-change:transform,opacity}
      @keyframes airpodsEnter{0%{opacity:0;transform:translateY(34px) scale(.925);filter:blur(5px) drop-shadow(0 22px 30px rgba(0,0,0,.2))}70%{opacity:1;transform:translateY(-4px) scale(1.008)}100%{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes airpodsFloat{0%,100%{transform:translateY(0) rotate(.001deg)}50%{transform:translateY(-8px) rotate(.001deg)}}
      @media (prefers-reduced-motion:reduce){.airpods-pro-render{animation:none!important}}
      .mini-case{background:rgba(255,255,255,.97)!important;display:grid!important;place-items:center!important;overflow:hidden!important}
      .mini-case:before,.mini-case:after,.mini-case span{display:none!important}
      .mini-case img{width:88%!important;height:88%!important;object-fit:contain!important;filter:drop-shadow(0 3px 5px rgba(0,0,0,.18))}
      .find-screen{background:#0b0e12!important}
      .find-header{top:calc(env(safe-area-inset-top,0px) + 12px)!important;padding-top:0!important}
      .find-header>div strong{font-size:20px!important;letter-spacing:-.02em!important}
      .find-header>div small{font-size:12px!important;color:rgba(255,255,255,.72)!important}
      .glass-btn,.zoom-cluster{background:rgba(22,24,29,.78)!important;border:1px solid rgba(255,255,255,.075)!important;box-shadow:0 10px 30px rgba(0,0,0,.26)!important;backdrop-filter:blur(18px) saturate(135%)!important}
      .map-tools{top:calc(env(safe-area-inset-top,0px) + 104px)!important;right:14px!important}
      #mapViewport,.leaflet-map{background:#dfe2e4!important}
      #mapViewport .leaflet-tile-pane{filter:none!important}
      #mapViewport.standard .leaflet-tile-pane{filter:none!important}
      #mapViewport.satellite .leaflet-tile-pane{filter:saturate(1.05) contrast(1.03) brightness(.9)!important}
      .leaflet-control-attribution{opacity:.38!important;font-size:7px!important}
      .map-dimming{background:linear-gradient(180deg,rgba(0,0,0,.33) 0%,rgba(0,0,0,.07) 18%,transparent 35%,transparent 70%,rgba(0,0,0,.14) 100%)!important}
      .find-sheet{left:12px!important;right:12px!important;bottom:10px!important;border-radius:30px!important;background:linear-gradient(180deg,rgba(26,27,32,.92),rgba(22,23,28,.96))!important;border:1px solid rgba(255,255,255,.065)!important;box-shadow:0 -14px 40px rgba(0,0,0,.28)!important;backdrop-filter:blur(24px) saturate(130%)!important;max-height:58dvh!important;padding-top:4px!important}
      .find-sheet.compact{max-height:54dvh!important}
      .find-sheet.expanded{max-height:76dvh!important}
      .find-sheet.sheet-peek{max-height:180px!important;overflow:hidden!important}
      .find-sheet.sheet-peek .day-strip,.find-sheet.sheet-peek .location-card,.find-sheet.sheet-peek .find-actions,.find-sheet.sheet-peek .history-toggle,.find-sheet.sheet-peek .timeline,.find-sheet.sheet-peek .map-note{display:none!important}
      .sheet-handle{height:28px!important;padding:3px 0 8px!important}
      .sheet-handle i{width:54px!important;height:5px!important;background:rgba(219,221,226,.55)!important}
      .device-summary{padding:0 8px 4px!important;grid-template-columns:58px 1fr!important;gap:14px!important}
      .summary-copy h2{font-size:21px!important;letter-spacing:-.02em!important}
      .summary-copy p{font-size:14px!important;color:#d6d7dc!important}
      .summary-copy small{font-size:13px!important;color:#9fa2aa!important}
      .day-strip{margin:12px 0 5px!important;gap:8px!important}
      .day-btn{border-radius:16px!important;padding:9px 4px!important;background:rgba(255,255,255,.045)!important}
      .day-btn.active{background:#fff!important;color:#17191e!important;box-shadow:0 5px 14px rgba(0,0,0,.18)!important}
      .location-card{border-radius:18px!important;background:rgba(255,255,255,.042)!important;padding:14px 16px!important}
      .find-actions{gap:10px!important;margin-top:12px!important}
      .find-actions button{min-height:100px!important;border-radius:20px!important;background:rgba(255,255,255,.035)!important}
      .find-actions span{width:44px!important;height:44px!important;background:rgba(255,255,255,.075)!important}
      #sheetRestore{background:rgba(23,25,30,.86)!important;border:1px solid rgba(255,255,255,.07)!important;backdrop-filter:blur(20px) saturate(130%)!important;box-shadow:0 12px 32px rgba(0,0,0,.26)!important}
      .airpods-map-marker .pin{font-size:15px!important;border:2px solid rgba(255,255,255,.94)!important;background:#fff!important;box-shadow:0 9px 24px rgba(0,0,0,.25)!important}
      .airpods-map-marker.selected .pin{box-shadow:0 0 0 12px rgba(47,140,255,.15),0 12px 28px rgba(0,0,0,.28)!important}
    `;
    document.head.appendChild(style);
  }

  function upgradeAirPodsArt() {
    const stage = document.querySelector('.airpods-stage');
    if (stage && !stage.querySelector('.airpods-pro-render')) {
      const img = document.createElement('img');
      img.className = 'airpods-pro-render';
      img.src = AIRPODS_IMG;
      img.alt = 'AirPods Pro';
      img.decoding = 'async';
      img.fetchPriority = 'high';
      stage.appendChild(img);
    }

    const mini = document.querySelector('.mini-case');
    if (mini && !mini.querySelector('img')) {
      const img = document.createElement('img');
      img.src = AIRPODS_IMG;
      img.alt = '';
      mini.appendChild(img);
    }
  }

  function focusPointWithSheetOffset(animate = true) {
    try {
      if (typeof realMap === 'undefined' || !realMap || typeof points === 'undefined') return;
      const id = typeof selectedPoint !== 'undefined' ? selectedPoint : 3;
      const p = points[id];
      if (!p) return;
      const zoom = Math.min(Math.max(typeof mapZoom !== 'undefined' ? mapZoom : 18, 15), 19);
      if (animate) realMap.flyTo([p.lat, p.lng], zoom, { duration: .55 });
      else realMap.setView([p.lat, p.lng], zoom, { animate: false });
      window.setTimeout(() => {
        if (realMap) realMap.panBy([0, 145], { animate: true, duration: .32 });
      }, animate ? 520 : 60);
    } catch (_) {}
  }

  function upgradeMapTiles() {
    try {
      if (typeof realMap === 'undefined' || !realMap || !window.L) return false;
      if (realMap.__proTilesReady) return true;

      if (typeof activeBaseLayer !== 'undefined' && activeBaseLayer && realMap.hasLayer(activeBaseLayer)) {
        realMap.removeLayer(activeBaseLayer);
      }

      roadLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 20, attribution: '© OpenStreetMap © CARTO'
      });
      satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, attribution: 'Tiles © Esri'
      });
      mapMode = 'roadmap';
      activeBaseLayer = roadLayer.addTo(realMap);
      realMap.__proTilesReady = true;
      realMap.invalidateSize();
      focusPointWithSheetOffset(false);
      return true;
    } catch (_) {
      return false;
    }
  }

  function improveMapInteractions() {
    const recenter = document.getElementById('recenterBtn');
    if (recenter && !recenter.dataset.proBound) {
      recenter.dataset.proBound = '1';
      recenter.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        focusPointWithSheetOffset(true);
      }, true);
    }

    const dayStrip = document.getElementById('dayStrip');
    if (dayStrip && !dayStrip.dataset.proBound) {
      dayStrip.dataset.proBound = '1';
      dayStrip.addEventListener('click', () => window.setTimeout(() => focusPointWithSheetOffset(false), 760));
    }

    const viewport = document.getElementById('mapViewport');
    if (viewport && !viewport.dataset.proBound) {
      viewport.dataset.proBound = '1';
      viewport.addEventListener('pointerdown', () => {
        try {
          if (typeof setFindSheetState === 'function') {
            const state = document.getElementById('findSheet')?.dataset.sheetState;
            if (state === 'normal' || state === 'expanded') setFindSheetState('peek');
          }
        } catch (_) {}
      }, { passive: true });
    }
  }

  function polishSheetInitialState() {
    try {
      const sheet = document.getElementById('findSheet');
      if (!sheet || sheet.dataset.proInitialised) return;
      sheet.dataset.proInitialised = '1';
      if (typeof setFindSheetState === 'function') setFindSheetState('normal');
    } catch (_) {}
  }

  function boot() {
    addStyles();
    upgradeAirPodsArt();
    improveMapInteractions();
    polishSheetInitialState();

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      upgradeAirPodsArt();
      improveMapInteractions();
      polishSheetInitialState();
      if (upgradeMapTiles() || tries > 30) clearInterval(timer);
    }, 180);

    const findBtn = document.getElementById('findDeviceBtn');
    if (findBtn) findBtn.addEventListener('click', () => {
      setTimeout(upgradeAirPodsArt, 60);
      setTimeout(upgradeMapTiles, 350);
      setTimeout(() => focusPointWithSheetOffset(false), 1800);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
