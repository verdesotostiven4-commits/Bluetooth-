const CACHE='bluetooth-v8';
const ASSETS=['/','/index.html','/manifest.webmanifest','/styles-3.css','/styles-3-base.css','/fidelity.css','/app-3.js','/app-3-base.js','/icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{try{const r=await fetch(e.request);if(new URL(e.request.url).origin===location.origin){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{});}return r;}catch{return (await caches.match(e.request))||Response.error();}})());});
