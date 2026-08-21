const CACHE='bluetooth-v6';
const ASSETS=['/','/index.html','/manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{try{const fresh=await fetch(e.request);if(new URL(e.request.url).origin===location.origin){const c=await caches.open(CACHE);c.put(e.request,fresh.clone()).catch(()=>{});}return fresh;}catch(err){return (await caches.match(e.request))||Response.error();}})());});