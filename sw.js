const CACHE_NAME = 'travel-help-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap',
];

// 安裝：把所有資源存進快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 字型 CSS 用 no-cors 抓，其他正常
      const requests = ASSETS.map(url => {
        if (url.startsWith('https://fonts.googleapis.com')) {
          return cache.add(new Request(url, { mode: 'no-cors' }));
        }
        return cache.add(url);
      });
      return Promise.allSettled(requests);
    })
  );
  self.skipWaiting();
});

// 啟動：清掉舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 攔截請求：有快取就用快取，沒有才去網路抓（並存起來）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 只快取成功的 GET 請求
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // 完全離線又沒快取時，回傳空白頁避免錯誤
        return new Response('<h2>目前離線，請先連線開啟一次網頁以啟用離線功能</h2>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      });
    })
  );
});
