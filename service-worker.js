const VERSION = '13.0.0';
const CACHE_NAME = `life-mirror-tarot-v${VERSION}`;
const asset = path => new URL(path, self.registration.scope).toString();
const APP_SHELL = [
  './','./index.html','./offline.html','./manifest.webmanifest','./version.json',
  './css/main.css','./css/v13.css','./data/major-arcana.js','./data/minor-arcana.js',
  './js/storage.js','./js/card-viewer.js','./js/library.js','./js/share.js','./js/history.js','./js/app.js','./js/pwa.js',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png',
  './assets/cards/c01.webp','./assets/cards/c02.webp','./assets/cards/c03.webp','./assets/cards/c04.webp','./assets/cards/c05.webp','./assets/cards/c06.webp','./assets/cards/c07.webp','./assets/cards/c08.webp','./assets/cards/c09.webp','./assets/cards/c10.webp','./assets/cards/c11.webp','./assets/cards/c12.webp','./assets/cards/c13.webp','./assets/cards/c14.webp','./assets/cards/p01.webp','./assets/cards/p02.webp','./assets/cards/p03.webp','./assets/cards/p04.webp','./assets/cards/p05.webp','./assets/cards/p06.webp','./assets/cards/p07.webp','./assets/cards/p08.webp','./assets/cards/p09.webp','./assets/cards/p10.webp','./assets/cards/p11.webp','./assets/cards/p12.webp','./assets/cards/p13.webp','./assets/cards/p14.webp','./assets/cards/s01.webp','./assets/cards/s02.webp','./assets/cards/s03.webp','./assets/cards/s04.webp','./assets/cards/s05.webp','./assets/cards/s06.webp','./assets/cards/s07.webp','./assets/cards/s08.webp','./assets/cards/s09.webp','./assets/cards/s10.webp','./assets/cards/s11.webp','./assets/cards/s12.webp','./assets/cards/s13.webp','./assets/cards/s14.webp','./assets/cards/w01.webp','./assets/cards/w02.webp','./assets/cards/w03.webp','./assets/cards/w04.webp','./assets/cards/w05.webp','./assets/cards/w06.webp','./assets/cards/w07.webp','./assets/cards/w08.webp','./assets/cards/w09.webp','./assets/cards/w10.webp','./assets/cards/w11.webp','./assets/cards/w12.webp','./assets/cards/w13.webp','./assets/cards/w14.webp'
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
