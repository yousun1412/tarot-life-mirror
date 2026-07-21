const VERSION = '16.0.0';
const CORE_CACHE = `life-mirror-core-v${VERSION}`;
const RUNTIME_CACHE = `life-mirror-runtime-v${VERSION}`;
const CACHE_PREFIX = 'life-mirror-';
const asset = path => new URL(path, self.registration.scope).toString();

// 只预缓存启动必需文件。56张小阿尔卡那图片在首次查看时按需缓存，
// 避免一次缺图导致整次更新失败，也降低首次安装流量。
const CORE_SHELL = [
  './', './index.html', './offline.html', './manifest.webmanifest', './version.json',
  './css/main.css', './css/v14.css', './css/v15.css', './css/v16.css',
  './data/major-arcana.js', './data/minor-arcana.js', './data/interpretation-v16.js',
  './js/storage.js', './js/card-viewer.js', './js/library.js', './js/share.js',
  './js/history.js', './js/app.js', './js/pwa.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
].map(asset);

async function cacheCoreShell() {
  const cache = await caches.open(CORE_CACHE);
  for (const url of CORE_SHELL) {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error(`核心文件加载失败：${url} (${response.status})`);
    await cache.put(url, response);
  }
}

self.addEventListener('install', event => {
  event.waitUntil(cacheCoreShell());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && ![CORE_CACHE, RUNTIME_CACHE].includes(key))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') {
    event.ports?.[0]?.postMessage({ version: VERSION, coreCache: CORE_CACHE });
  }
});

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CORE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (fallbackUrl ? caches.match(asset(fallbackUrl)) : undefined);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CORE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  return cached || network || Response.error();
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html').then(response =>
      response || caches.match(asset('./offline.html'))
    ));
    return;
  }

  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(asset('./version.json'))));
    return;
  }

  if (url.pathname.includes('/assets/cards/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});
