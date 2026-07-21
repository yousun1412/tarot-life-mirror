const VERSION = '12.0.0';
const CACHE_NAME = `life-mirror-tarot-v${VERSION}`;
const asset = path => new URL(path, self.registration.scope).toString();
const APP_SHELL = [
  './','./index.html','./offline.html','./manifest.webmanifest','./version.json',
  './css/main.css','./css/v12.css','./data/major-arcana.js',
  './js/storage.js','./js/card-viewer.js','./js/library.js','./js/share.js','./js/history.js','./js/app.js','./js/pwa.js',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'
].map(asset);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(asset('./index.html'),copy));return response;}).catch(async()=>await caches.match(event.request)||await caches.match(asset('./index.html'))||caches.match(asset('./offline.html'))));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    const network=fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>cached);
    return cached||network;
  }));
});
