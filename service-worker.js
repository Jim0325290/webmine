const CACHE_NAME = 'webcraft-cache-v1';
// 需緩存的遊戲資產列表
const ASSETS_TO_CACHE = [
    './', 
    './index.html',
    './manifest.json',
    './style.css',
    // ... 其他打包後的檔案和紋理 (例如: /assets/bundle.js, /assets/atlas.png)
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] 開始緩存核心資產');
            // 注意：這裡需要替換成您實際打包後的檔案路徑
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // 離線優先策略：有緩存就用緩存，沒有再請求網路
            return response || fetch(event.request);
        })
    );
});

// 清理舊緩存
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
