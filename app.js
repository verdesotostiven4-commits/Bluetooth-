const DEVICES = [
  { name: 'AirPods Pro #6', type: 'headphones', icon: '◖◗', target: 'airpods' },
  { name: 'CS-4405', type: 'other', icon: '▥' },
  { name: 'HAVIT SH002', type: 'headphones', icon: '◖◗' },
  { name: 'ITALY AUDIO', type: 'other', icon: '▥' },
  { name: 'LD-S650', type: 'headphones', icon: '◖◗' },
  { name: 'Leito', type: 'other', icon: '▥' },
  { name: 'Redmi Watch 5 Lite 35DF', type: 'watch', icon: '◉' }
];

// Demo chronology. No real GPS or Bluetooth data is collected.
const DETECTIONS = [
  { day: 'Domingo 16', time: '11:18', point: 1, title: 'Punto 1', note: 'Ubicación aproximada detectada por la red' },
  { day: 'Domingo 16', time: '17:46', point: 1, title: 'Punto 1', note: 'Nueva detección en la misma zona' },
  { day: 'Domingo 16', time: '22:53', point: 2, title: 'Punto 2', note: 'Ubicación aproximada detectada por la red' },
  { day: 'Lunes 17', time: '10:06', point: 1, title: 'Punto 1', note: 'Ubicación aproximada detectada por la red' },
  { day: 'Lunes 17', time: '16:37', point: 1, title: 'Punto 1', note: 'Nueva detección en la misma zona' },
  { day: 'Lunes 17', time: '23:12', point: 2, title: 'Punto 2', note: 'Ubicación aproximada detectada por la red' },
  { day: 'Martes 18', time: '09:24', point: 1, title: 'Punto 1', note: 'Última detección registrada en esta zona' },
  { day: 'Martes 18', time: '21:47', point: 3, title: 'Punto 3', note: 'Primera detección en una zona diferente' },
  { day: 'Miércoles 19', time: '08:12', point: 3, title: 'Punto 3', note: 'Detectado nuevamente · sin conexión directa' },
  { day: 'Miércoles 19', time: '14:38', point: 3, title: 'Punto 3', note: 'Ubicación aproximada sin cambios relevantes' },
  { day: 'Miércoles 19', time: '23:06', point: 3, title: 'Punto 3', note: 'Detectado nuevamente en la misma zona' },
  { day: 'Jueves 20', time: '06:52', point: 3, title: 'Punto 3', note: 'Ubicación aproximada sin cambios relevantes' },
  { day: 'Jueves 20', time: '13:41', point: 3, title: 'Punto 3', note: 'Última ubicación disponible · sin conexión directa', current: true }
];

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const screens = {
  bluetooth: $('#bluetoothScreen'),
  airpods: $('#airpodsScreen'),
  find: $('#findScreen')
};
let currentScreen = 'bluetooth';
let deferredInstallPrompt = null;
let toastTimer = null;

function updateClock() {
  const now = new Date();
  $('#statusTime').textContent = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
}
updateClock();
setInterval(updateClock, 30000);

function showScreen(name) {
  if (!screens[name]) return;
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
  currentScreen = name;
  screens[name].scrollTop = 0;
  history.replaceState({ screen: name }, '', name === 'bluetooth' ? '/' : `#${name}`);
}

function toast(message, ms = 2100) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function renderDevices() {
  const container = $('#savedDevices');
  container.innerHTML = DEVICES.map(device => `
    <button class="device-card" data-target="${device.target || ''}">
      <span class="device-icon">${device.icon}</span>
      <span><strong>${device.name}</strong><small>Guardado</small></span>
      <span class="device-arrow">›</span>
    </button>
  `).join('');
  $$('.device-card', container).forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.target === 'airpods') showScreen('airpods');
    else toast('Dispositivo guardado · maqueta');
  }));
}
renderDevices();

$('#bluetoothToggle').addEventListener('click', (e) => {
  e.currentTarget.classList.toggle('is-on');
  toast(e.currentTarget.classList.contains('is-on') ? 'Bluetooth activado' : 'Bluetooth desactivado');
});

$$('[data-action="go-bluetooth"]').forEach(el => el.addEventListener('click', () => showScreen('bluetooth')));
$$('[data-action="go-airpods"]').forEach(el => el.addEventListener('click', () => showScreen('airpods')));
$$('[data-action="back-home"]').forEach(el => el.addEventListener('click', () => toast('Ya estás en Bluetooth')));

$$('.noise-mode').forEach(btn => btn.addEventListener('click', () => {
  $$('.noise-mode').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  const names = { transparency: 'Transparencia', cancel: 'Cancelación de ruido', off: 'Control de ruido desactivado' };
  toast(names[btn.dataset.mode]);
}));

$$('.interactive-switch').forEach(sw => sw.parentElement.addEventListener('click', () => {
  sw.classList.toggle('is-on');
}));

$('#disconnectBtn').addEventListener('click', () => toast('AirPods Pro #6 desconectados'));
$('#unpairBtn').addEventListener('click', () => toast('Acción simulada: desemparejar'));

function renderTimeline() {
  const timeline = $('#timeline');
  let day = '';
  timeline.innerHTML = DETECTIONS.map((d, idx) => {
    const dayHeader = d.day !== day ? `<div class="timeline-day">${d.day} de agosto</div>` : '';
    day = d.day;
    return `${dayHeader}
      <button class="timeline-item ${d.current ? 'current' : ''}" data-point="${d.point}" data-index="${idx}">
        <span class="timeline-time">${d.time}</span>
        <span class="timeline-track"><i></i></span>
        <span class="timeline-info"><strong>${d.title}</strong><small>${d.note}</small></span>
      </button>`;
  }).join('');
  $$('.timeline-item', timeline).forEach(item => item.addEventListener('click', () => {
    selectPoint(Number(item.dataset.point));
    const d = DETECTIONS[Number(item.dataset.index)];
    $('#lastSeenText').textContent = `Detectado ${d.day.toLowerCase()} a las ${d.time} · ${d.title}`;
    toast(`${d.title} · ${d.day}, ${d.time}`);
  }));
}
renderTimeline();

function selectPoint(point) {
  $$('.map-pin').forEach(p => p.classList.remove('is-current'));
  $$('.uncertainty-ring').forEach(r => r.classList.remove('is-current'));
  $(`.point-${point}`).classList.add('is-current');
  $(`.point-${point}-ring`).classList.add('is-current');
  const transforms = {
    1: 'translate(10%, 10%) scale(1.12)',
    2: 'translate(-10%, 4%) scale(1.12)',
    3: 'translate(0, -5%) scale(1.1)'
  };
  $('#mapCanvas').style.transform = transforms[point];
  setTimeout(() => { $('#mapCanvas').style.transform = 'none'; }, 900);
}

$$('.map-pin').forEach(pin => pin.addEventListener('click', () => {
  const point = Number(pin.dataset.point);
  selectPoint(point);
  const last = [...DETECTIONS].reverse().find(d => d.point === point);
  $('#lastSeenText').textContent = `Detectado ${last.day.toLowerCase()} a las ${last.time} · Punto ${point}`;
}));

function runSyncSequence() {
  const overlay = $('#syncOverlay');
  const title = $('#syncTitle');
  const text = $('#syncText');
  const progress = $('#syncProgress');
  overlay.classList.remove('hidden');
  progress.style.width = '18%';
  title.textContent = 'Buscando AirPods…';
  text.textContent = 'Consultando la última ubicación disponible';
  setTimeout(() => {
    progress.style.width = '58%';
    title.textContent = 'Sincronizando…';
    text.textContent = 'Revisando detecciones recientes de la red';
  }, 850);
  setTimeout(() => {
    progress.style.width = '88%';
    title.textContent = 'Ubicación encontrada';
    text.textContent = 'Se encontró una ubicación aproximada reciente';
  }, 1750);
  setTimeout(() => {
    progress.style.width = '100%';
    setTimeout(() => overlay.classList.add('hidden'), 380);
  }, 2550);
}

$('#findDeviceBtn').addEventListener('click', () => {
  showScreen('find');
  requestAnimationFrame(runSyncSequence);
});

$('#historyToggle').addEventListener('click', () => {
  $('#timeline').classList.toggle('collapsed');
  $('#historyChevron').textContent = $('#timeline').classList.contains('collapsed') ? '⌄' : '⌃';
});

$('#soundBtn').addEventListener('click', () => {
  toast('Intentando conectar…');
  setTimeout(() => toast('Sin conexión directa. El sonido se reproducirá cuando estén disponibles.', 3200), 900);
});

$('#directionsBtn').addEventListener('click', () => toast('Indicaciones de demostración hacia la última zona detectada'));
$('#recenterBtn').addEventListener('click', () => { selectPoint(3); toast('Centrado en la última ubicación'); });
$('#layersBtn').addEventListener('click', () => toast('Vista de mapa: estándar oscuro'));
$('#moreFindBtn').addEventListener('click', () => toast('Opciones del dispositivo · modo demostración'));

$('#nearbyBtn').addEventListener('click', () => {
  const overlay = $('#nearbyOverlay');
  overlay.classList.remove('hidden');
  $('#nearbyStatus').textContent = 'Buscando señal…';
  $('#nearbyText').textContent = 'Muévete por la zona para intentar establecer una conexión directa.';
  setTimeout(() => {
    $('#nearbyStatus').textContent = 'Fuera del alcance';
    $('#nearbyText').textContent = 'No se pudo establecer una conexión directa. La última ubicación sigue siendo aproximada.';
  }, 3300);
});
$('#closeNearby').addEventListener('click', () => $('#nearbyOverlay').classList.add('hidden'));

window.addEventListener('popstate', () => {
  if (currentScreen === 'find') showScreen('airpods');
  else if (currentScreen === 'airpods') showScreen('bluetooth');
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $('#installBtn').classList.remove('hidden');
});
$('#installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $('#installBtn').classList.add('hidden');
});
window.addEventListener('appinstalled', () => toast('Bluetooth instalado'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

const initialHash = location.hash.replace('#', '');
if (initialHash === 'airpods' || initialHash === 'find') showScreen(initialHash);
