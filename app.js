const DEVICES = [
  { name: 'AirPods Pro #6', icon: 'headphones', target: 'airpods' },
  { name: 'CS-4405', icon: 'device' },
  { name: 'HAVIT SH002', icon: 'headphones' },
  { name: 'ITALY AUDIO', icon: 'device' },
  { name: 'LD-S650', icon: 'headphones' },
  { name: 'Leito', icon: 'device' },
  { name: 'Redmi Watch 5 Lite 35DF', icon: 'watch' }
];

const DETECTIONS = [
  { date: '2026-08-16', day: 'Domingo 16', short: 'Dom', time: '11:18', point: 1, note: 'Ubicación aproximada detectada por la red' },
  { date: '2026-08-16', day: 'Domingo 16', short: 'Dom', time: '17:46', point: 1, note: 'Nueva señal en la misma zona' },
  { date: '2026-08-16', day: 'Domingo 16', short: 'Dom', time: '22:53', point: 2, note: 'Ubicación aproximada detectada por la red' },
  { date: '2026-08-17', day: 'Lunes 17', short: 'Lun', time: '10:06', point: 1, note: 'Ubicación aproximada detectada por la red' },
  { date: '2026-08-17', day: 'Lunes 17', short: 'Lun', time: '16:37', point: 1, note: 'Nueva señal en la misma zona' },
  { date: '2026-08-17', day: 'Lunes 17', short: 'Lun', time: '23:12', point: 2, note: 'Ubicación aproximada detectada por la red' },
  { date: '2026-08-18', day: 'Martes 18', short: 'Mar', time: '09:24', point: 1, note: 'Última detección registrada en esta zona' },
  { date: '2026-08-18', day: 'Martes 18', short: 'Mar', time: '21:47', point: 3, note: 'Primera señal registrada en una zona diferente' },
  { date: '2026-08-19', day: 'Miércoles 19', short: 'Mié', time: '08:12', point: 3, note: 'Señal recibida · sin conexión directa' },
  { date: '2026-08-19', day: 'Miércoles 19', short: 'Mié', time: '14:38', point: 3, note: 'Ubicación aproximada sin cambios relevantes' },
  { date: '2026-08-19', day: 'Miércoles 19', short: 'Mié', time: '23:06', point: 3, note: 'Nueva señal en la misma zona' },
  { date: '2026-08-20', day: 'Jueves 20', short: 'Hoy', time: '06:52', point: 3, note: 'Ubicación aproximada sin cambios relevantes' },
  { date: '2026-08-20', day: 'Jueves 20', short: 'Hoy', time: '14:42', point: 3, note: 'Última señal disponible · sin conexión directa', current: true }
];

const POINT_META = {
  1: { title: 'Punto 1', detail: 'Zona habitual · ubicación aproximada', worldX: 276, worldY: 539, zoom: 0.63 },
  2: { title: 'Punto 2', detail: 'Detección nocturna · ubicación aproximada', worldX: 879, worldY: 889, zoom: 0.66 },
  3: { title: 'Punto 3', detail: 'Última zona detectada · sin conexión directa', worldX: 699, worldY: 1209, zoom: 0.72 }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const screens = { bluetooth: $('#bluetoothScreen'), airpods: $('#airpodsScreen'), find: $('#findScreen') };
let currentScreen = 'bluetooth';
let deferredInstallPrompt = null;
let toastTimer = null;
let selectedPoint = 3;
let selectedDate = '2026-08-20';
let historyOpen = false;

function icon(name) { return `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`; }
function toast(message, ms = 1800) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function modal(title, text) {
  $('#modalTitle').textContent = title; $('#modalText').textContent = text; $('#modal').classList.remove('hidden');
}
$('#modalClose').addEventListener('click', () => $('#modal').classList.add('hidden'));

function showScreen(name, { sync = false } = {}) {
  if (!screens[name]) return;
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
  currentScreen = name;
  if (name !== 'find') screens[name].scrollTop = 0;
  history.replaceState({ screen: name }, '', name === 'bluetooth' ? '/' : `#${name}`);
  if (name === 'find') {
    requestAnimationFrame(() => {
      fitInitialMap(); selectDetection(DETECTIONS.length - 1, { center: true, quiet: true }); if (sync) runSyncSequence();
    });
  }
}

function renderDevices() {
  $('#savedDevices').innerHTML = DEVICES.map(d => `
    <button class="device-card" data-target="${d.target || ''}" type="button">
      <span class="device-icon">${icon(d.icon)}</span><span class="copy"><strong>${d.name}</strong><small>Guardado</small></span><span class="device-arrow">${icon('chevron')}</span>
    </button>`).join('');
  $$('.device-card').forEach(btn => btn.addEventListener('click', () => btn.dataset.target === 'airpods' ? showScreen('airpods') : toast('Dispositivo guardado')));
}
renderDevices();

function bindCollapsingHeaders() {
  $$('.collapsible').forEach(bar => {
    const screen = document.getElementById(bar.dataset.collapseFor);
    const update = () => bar.classList.toggle('scrolled', screen.scrollTop > 58);
    screen.addEventListener('scroll', update, { passive: true }); update();
  });
}
bindCollapsingHeaders();

$('#bluetoothToggle').addEventListener('click', e => { e.currentTarget.classList.toggle('is-on'); toast(e.currentTarget.classList.contains('is-on') ? 'Bluetooth activado' : 'Bluetooth desactivado'); });
$$('[data-action="go-bluetooth"]').forEach(el => el.addEventListener('click', () => showScreen('bluetooth')));
$$('[data-action="go-airpods"]').forEach(el => el.addEventListener('click', () => showScreen('airpods')));
$$('[data-action="back-home"]').forEach(el => el.addEventListener('click', () => toast('Bluetooth')));
$$('.noise-mode').forEach(btn => btn.addEventListener('click', () => { $$('.noise-mode').forEach(x => x.classList.remove('active')); btn.classList.add('active'); }));
$$('.interactive-row').forEach(row => row.addEventListener('click', event => { const sw = $('.interactive-switch', row); if (sw) sw.classList.toggle('is-on'); event.stopPropagation(); }));
$('#disconnectBtn').addEventListener('click', () => toast('AirPods Pro #6 desconectados'));
$('#unpairBtn').addEventListener('click', () => modal('Desemparejar AirPods Pro #6', 'Se eliminaría este dispositivo de la lista de equipos guardados.'));
$('#findDeviceBtn').addEventListener('click', () => showScreen('find', { sync: true }));

function runSyncSequence() {
  const overlay = $('#syncOverlay'), title = $('#syncTitle'), text = $('#syncText'), progress = $('#syncProgress');
  overlay.classList.remove('hidden'); progress.style.width = '14%'; title.textContent = 'Buscando AirPods…'; text.textContent = 'Consultando la última ubicación disponible';
  setTimeout(() => { progress.style.width = '52%'; title.textContent = 'Sincronizando…'; text.textContent = 'Revisando las detecciones recientes de la red'; }, 520);
  setTimeout(() => { progress.style.width = '88%'; title.textContent = 'Ubicación encontrada'; text.textContent = 'Se encontró una ubicación aproximada reciente'; }, 1120);
  setTimeout(() => { progress.style.width = '100%'; }, 1530);
  setTimeout(() => overlay.classList.add('hidden'), 1810);
}

function formatAge(date, time) {
  const then = new Date(`${date}T${time}:00-06:00`), now = new Date();
  let mins = Math.max(0, Math.floor((now - then) / 60000)); if (!Number.isFinite(mins)) return '—';
  if (mins < 1) return 'ahora'; if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60); if (hours < 24) return `hace ${hours} h`; return `hace ${Math.floor(hours / 24)} d`;
}

function renderDayStrip() {
  const unique = [];
  DETECTIONS.forEach(d => { if (!unique.some(x => x.date === d.date)) unique.push({ date: d.date, short: d.short }); });
  $('#dayStrip').innerHTML = unique.map(d => { const num = d.date.slice(-2).replace(/^0/, ''); return `<button class="day-chip ${d.date === selectedDate ? 'active' : ''}" data-date="${d.date}"><strong>${d.short}</strong><small>${num} ago.</small></button>`; }).join('');
  $$('.day-chip').forEach(btn => btn.addEventListener('click', () => {
    selectedDate = btn.dataset.date; $$('.day-chip').forEach(x => x.classList.toggle('active', x === btn));
    const index = DETECTIONS.map((d, i) => ({ d, i })).filter(x => x.d.date === selectedDate).at(-1)?.i; if (index !== undefined) selectDetection(index, { center: true });
  }));
}
renderDayStrip();

function renderTimeline() {
  let lastDay = '';
  $('#timeline').innerHTML = DETECTIONS.map((d, index) => {
    const header = d.day !== lastDay ? `<div class="timeline-day">${d.day} de agosto</div>` : ''; lastDay = d.day;
    return `${header}<button class="timeline-item ${d.current ? 'current' : ''}" data-index="${index}" type="button"><span class="timeline-time">${d.time}</span><span class="timeline-track"><i></i></span><span class="timeline-info"><strong>Punto ${d.point}</strong><small>${d.note}</small></span></button>`;
  }).join('');
  $$('.timeline-item').forEach(item => item.addEventListener('click', () => selectDetection(Number(item.dataset.index), { center: true })));
}
renderTimeline();

function selectDetection(index, { center = true, quiet = false } = {}) {
  const detection = DETECTIONS[index]; if (!detection) return;
  selectedPoint = detection.point; selectedDate = detection.date;
  $$('.map-marker').forEach(m => m.classList.toggle('active', Number(m.dataset.point) === selectedPoint));
  $$('.map-accuracy').forEach(r => r.classList.remove('active')); $(`.p${selectedPoint}-accuracy`).classList.add('active');
  $$('.day-chip').forEach(x => x.classList.toggle('active', x.dataset.date === selectedDate));
  const meta = POINT_META[selectedPoint];
  $('#selectedPointTitle').textContent = meta.title; $('#selectedPointDetail').textContent = meta.detail;
  $('#lastSeenText').textContent = `${detection.day}, ${detection.time} · ${meta.title}`; $('#locationAge').textContent = formatAge(detection.date, detection.time);
  $('#findHeaderStatus').textContent = selectedPoint === 3 ? 'Sin conexión · ubicación aproximada' : 'Detección anterior · ubicación aproximada';
  if (center) centerOnPoint(selectedPoint, true); if (!quiet) toast(`${meta.title} · ${detection.day}, ${detection.time}`);
}

$$('.map-marker').forEach(marker => marker.addEventListener('click', event => {
  event.stopPropagation(); const point = Number(marker.dataset.point);
  const index = DETECTIONS.map((d, i) => ({ d, i })).filter(x => x.d.point === point).at(-1)?.i; if (index !== undefined) selectDetection(index, { center: true });
}));
$('#historyToggle').addEventListener('click', () => { historyOpen = !historyOpen; $('#historyToggle').classList.toggle('open', historyOpen); $('#timeline').classList.toggle('open', historyOpen); if (historyOpen) $('#findSheet').classList.remove('compact'); });
$('#sheetHandle').addEventListener('click', () => $('#findSheet').classList.toggle('compact'));

const mapViewport = $('#mapViewport'), mapWorld = $('#mapWorld');
const camera = { scale: .66, x: -250, y: -660 }, bounds = { minScale: .42, maxScale: 1.25 };
let pointers = new Map(), dragStart = null, pinchStart = null, mapInitialized = false;
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function viewportSize() { return { w: mapViewport.clientWidth, h: mapViewport.clientHeight }; }
function applyCamera(animate = false) {
  mapWorld.style.transition = animate ? 'transform .48s cubic-bezier(.2,.8,.2,1)' : 'none';
  mapWorld.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.scale})`; if (animate) setTimeout(() => { mapWorld.style.transition = 'none'; }, 520);
}
function constrainCamera() {
  const { w, h } = viewportSize(), worldW = 1200 * camera.scale, worldH = 1700 * camera.scale, margin = 70;
  camera.x = clamp(camera.x, Math.min(margin, w - worldW - margin), margin); camera.y = clamp(camera.y, Math.min(margin, h - worldH - margin), margin);
}
function fitInitialMap() { if (!mapViewport.clientWidth) return; if (!mapInitialized) { camera.scale = clamp(mapViewport.clientWidth / 700, .48, .72); mapInitialized = true; } centerOnPoint(selectedPoint, false); }
function centerOnPoint(point, animate = true) {
  const meta = POINT_META[point]; if (!meta) return; const { w, h } = viewportSize();
  camera.scale = clamp(Math.max(camera.scale, meta.zoom), bounds.minScale, bounds.maxScale); camera.x = w * .5 - meta.worldX * camera.scale; camera.y = h * .36 - meta.worldY * camera.scale; constrainCamera(); applyCamera(animate);
}
function zoomAt(factor, clientX = mapViewport.clientWidth / 2, clientY = mapViewport.clientHeight / 2) {
  const rect = mapViewport.getBoundingClientRect(), px = clientX - rect.left, py = clientY - rect.top, oldScale = camera.scale, newScale = clamp(oldScale * factor, bounds.minScale, bounds.maxScale), wx = (px - camera.x) / oldScale, wy = (py - camera.y) / oldScale;
  camera.scale = newScale; camera.x = px - wx * newScale; camera.y = py - wy * newScale; constrainCamera(); applyCamera(false);
}
mapViewport.addEventListener('pointerdown', e => {
  if (e.target.closest('button')) return; mapViewport.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) dragStart = { x: e.clientX, y: e.clientY, camX: camera.x, camY: camera.y };
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: camera.scale }; }
});
mapViewport.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1 && dragStart) { camera.x = dragStart.camX + e.clientX - dragStart.x; camera.y = dragStart.camY + e.clientY - dragStart.y; constrainCamera(); applyCamera(false); }
  else if (pointers.size === 2 && pinchStart) { const [a, b] = [...pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y), midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2, factor = (dist / pinchStart.distance) * (pinchStart.scale / camera.scale); zoomAt(factor, midX, midY); }
});
function endPointer(e) { pointers.delete(e.pointerId); if (pointers.size === 0) { dragStart = null; pinchStart = null; } }
mapViewport.addEventListener('pointerup', endPointer); mapViewport.addEventListener('pointercancel', endPointer);
mapViewport.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.12 : .89, e.clientX, e.clientY); }, { passive: false });
let lastTap = 0; mapViewport.addEventListener('pointerup', e => { const now = Date.now(); if (now - lastTap < 300) zoomAt(1.25, e.clientX, e.clientY); lastTap = now; });
$('#zoomInBtn').addEventListener('click', () => zoomAt(1.18)); $('#zoomOutBtn').addEventListener('click', () => zoomAt(.84)); $('#recenterBtn').addEventListener('click', () => centerOnPoint(selectedPoint, true));
$('#layersBtn').addEventListener('click', () => { mapViewport.classList.toggle('satellite'); toast(mapViewport.classList.contains('satellite') ? 'Vista detallada' : 'Vista estándar'); });
window.addEventListener('resize', () => currentScreen === 'find' && centerOnPoint(selectedPoint, false));

$('#directionsBtn').addEventListener('click', () => { $('#routePath').classList.remove('hidden'); $('#routeChip').classList.remove('hidden'); camera.scale = .49; camera.x = -40; camera.y = -480; constrainCamera(); applyCamera(true); });
$('#closeRoute').addEventListener('click', () => { $('#routePath').classList.add('hidden'); $('#routeChip').classList.add('hidden'); centerOnPoint(selectedPoint, true); });
$('#soundBtn').addEventListener('click', () => modal('Reproducir sonido', 'Los AirPods no tienen conexión directa en este momento. El sonido se intentaría reproducir cuando vuelvan a estar disponibles.'));
$('#nearbyBtn').addEventListener('click', () => {
  $('#nearbyOverlay').classList.remove('hidden'); $('#nearbyStatus').textContent = 'Buscando señal…'; $('#nearbyText').textContent = 'Muévete por la zona para intentar establecer una conexión directa.'; clearTimeout(window.__nearbyTimer);
  window.__nearbyTimer = setTimeout(() => { $('#nearbyStatus').textContent = 'Fuera del alcance'; $('#nearbyText').textContent = 'No se pudo establecer una conexión directa. La última ubicación disponible sigue siendo aproximada.'; }, 3000);
});
$('#closeNearby').addEventListener('click', () => $('#nearbyOverlay').classList.add('hidden'));
$('#moreFindBtn').addEventListener('click', () => modal('AirPods Pro #6', 'Última ubicación aproximada disponible. No hay conexión directa con los AirPods.'));

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', ''); if (hash === 'airpods') showScreen('airpods'); else if (hash === 'find') showScreen('find'); else showScreen('bluetooth');
});
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').addEventListener('click', async () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('#installBtn').classList.add('hidden'); });
window.addEventListener('appinstalled', () => $('#installBtn').classList.add('hidden'));

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; location.reload(); });
  window.addEventListener('load', async () => { try { const reg = await navigator.serviceWorker.register('/sw.js'); reg.update(); } catch (_) {} });
}
const initial = location.hash.replace('#', ''); if (initial === 'airpods' || initial === 'find') showScreen(initial); else showScreen('bluetooth');
