const CACHE='calisthenics-v3';
const ASSETS=['./','./index.html','./style.css','./app.js','./workouts.js','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(response=>{if(response.ok&&new URL(e.request.url).origin===self.location.origin){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}return response}).catch(()=>caches.match(e.request)))});