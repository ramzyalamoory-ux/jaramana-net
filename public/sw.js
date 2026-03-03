// Jaramana Net Service Worker v2.0
// يدعم العمل بدون إنترنت مع مزامنة البيانات

const CACHE_NAME = 'jaramana-net-v2';
const OFFLINE_URL = '/offline.html';

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo-jaramana.jpg',
  '/offline.html'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache:', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// استراتيجية التخزين المؤقت
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات Supabase API (نريد دائماً البيانات الجديدة)
  if (url.hostname.includes('supabase.co')) {
    // استخدم Network First مع Offline Fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          // احفظ الرد في IndexedDB عبر الرسائل
          return response;
        })
        .catch(() => {
          // إذا فشل الطلب، أرجع بيانات من IndexedDB
          return new Response(
            JSON.stringify({ 
              error: 'offline', 
              message: 'أنت غير متصل بالإنترنت. البيانات المعروضة من الذاكرة المحلية.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }

  // للملفات الثابتة استخدم Cache First
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // أرجع الكاش ثم حدث في الخلفية
            fetch(request)
              .then((response) => {
                if (response.ok) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, response);
                  });
                }
              })
              .catch(() => {});
            
            return cachedResponse;
          }

          // إذا لم يكن في الكاش، اجلبه من الشبكة
          return fetch(request)
            .then((response) => {
              if (response.ok && request.method === 'GET') {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // إذا فشل كل شيء، أرجع صفحة offline
              if (request.destination === 'document') {
                return caches.match(OFFLINE_URL);
              }
              return new Response('Offline', { status: 503 });
            });
        })
    );
  }
});

// مزامنة البيانات عند عودة الإنترنت
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-subscribers') {
    event.waitUntil(syncSubscribers());
  }
  
  if (event.tag === 'sync-tickets') {
    event.waitUntil(syncTickets());
  }
  
  if (event.tag === 'sync-debts') {
    event.waitUntil(syncDebts());
  }
});

// دالة مزامنة المشتركين
async function syncSubscribers() {
  console.log('[SW] Syncing subscribers...');
  // البيانات ستُرسل من الصفحة عبر postMessage
}

// استقبال الرسائل من الصفحة
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_DATA') {
    // حفظ البيانات في IndexedDB
    cacheData(event.data.store, event.data.data);
  }
  
  if (event.data.type === 'SYNC_NOW') {
    // طلب مزامنة فورية
    self.registration.sync.register('sync-subscribers');
  }
});

// إشعارات Push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data?.text() || 'إشعار جديد من جرمانا نت',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Jaramana Net', options)
  );
});

// التعامل مع النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// دالة حفظ البيانات في IndexedDB
async function cacheData(storeName, data) {
  // سيتم التعامل مع IndexedDB من الصفحة الرئيسية
  console.log('[SW] Caching data for:', storeName);
}

console.log('[SW] Service Worker loaded - Jaramana Net PWA');
