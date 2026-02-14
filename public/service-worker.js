// 缓存名称
const CACHE_NAME = 'my-wife-manager-v1';

// 需要缓存的资源
const STATIC_ASSETS = [
  '/my-wife-manager0210/',
  '/my-wife-manager0210/index.html',
  '/my-wife-manager0210/manifest.json',
  '/my-wife-manager0210/favicon.ico'
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

//  fetch 事件 - 从缓存中获取资源
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有资源，直接返回
        if (response) {
          return response;
        }

        // 否则从网络获取
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();

            // 将新获取的资源添加到缓存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 如果网络请求失败，返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/my-wife-manager0210/');
            }
          });
      })
  );
});

// 后台同步事件（如果需要）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 同步数据的函数
async function syncData() {
  // 这里可以实现数据同步逻辑
  console.log('Syncing data...');
  // 例如，将本地存储的数据同步到服务器
}

// 推送通知事件（如果需要）
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/my-wife-manager0210/favicon.ico',
    badge: '/my-wife-manager0210/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});