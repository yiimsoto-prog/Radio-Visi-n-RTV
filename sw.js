// ==============================================================
// SERVICE WORKER - RADIOVISIÓN RTV (PWA PROFESIONAL V2.1.0)
// Optimizado para Streaming en Vivo de Audio/Video + Offline Cache
// ==============================================================

const APP_VERSION = '2.5.1';
const CACHE_NAME = 'radiovision-pwa-v' + APP_VERSION;
const BIBLE_CACHE_NAME = 'radiovision-bible-cache-v2';

// Recursos estáticos esenciales para funcionamiento PWA offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/theme.css',
  './css/dark.css',
  './css/components.css',
  './js/security.js',
  './js/schema.js',
  './js/pwa.js',
  './js/firebase-config.js',
  './js/app.js',
  './decision.html',
  './img/logo-radio.jpg',
  './img/logo-iglesia.jpg',
  './img/templo-central.jpg',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/apple-touch-icon.png'
];

// Instalación: Precarga de assets críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW ${APP_VERSION}] Precargando assets estáticos.`);
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Advertencia almacenando assets estáticos:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: Purga de cachés antiguas excepto la versión actual y la Biblia
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== BIBLE_CACHE_NAME) {
            console.log('[SW] Purgando caché anterior obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Mensajería con el cliente (SKIP_WAITING y PUSH)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING recibido. Tomando control de la página.');
    self.skipWaiting();
  }

  // Notificación local disparada desde la app
  if (event.data && event.data.type === 'NOTIFY_LIVE') {
    const payload = event.data.payload || {};
    const options = {
      body: payload.body || '¡Estamos transmitiendo el Culto Congregacional en vivo!',
      icon: './img/logo-radio.jpg',
      badge: './img/logo-radio.jpg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'radiovision-live-alert',
      renotify: true,
      data: { url: payload.url || './#culto-en-vivo' }
    };
    event.waitUntil(
      self.registration.showNotification(payload.title || '🔴 ¡Culto en Vivo en RadioVisión RTV!', options)
    );
  }
});

// ==============================================================
// GESTOR DE EVENTOS FETCH CON BYPASS PARA STREAMING EN VIVO
// ==============================================================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const reqUrl = req.url;

  // 1. BYPASS INMEDIATO: Métodos no-GET (POST, PUT, DELETE, etc.)
  if (req.method !== 'GET') {
    return;
  }

  // 2. BYPASS INMEDIATO: Streaming en vivo y peticiones de rango parcial (Range: bytes=...)
  // Evita saturar la memoria caché del navegador y previene cortes o buffering en la radio
  const isRangeRequest = req.headers && req.headers.has('range');
  const isMediaDestination = (req.destination === 'audio' || req.destination === 'video');
  const isLiveStreamUrl = (
    reqUrl.includes('zeno.fm') ||
    reqUrl.includes('stream.zeno.fm') ||
    reqUrl.includes('zenomedia') ||
    reqUrl.includes('icecast') ||
    reqUrl.includes('shoutcast') ||
    reqUrl.includes('usastreams.com') ||
    reqUrl.includes('youtube.com') ||
    reqUrl.includes('googlevideo.com') ||
    reqUrl.includes('facebook.com') ||
    reqUrl.includes('fbcdn.net') ||
    reqUrl.includes('firestore.googleapis.com') ||
    reqUrl.includes('firebaseinstallations.googleapis.com') ||
    reqUrl.includes('identitytoolkit.googleapis.com') ||
    reqUrl.includes('securetoken.googleapis.com') ||
    /\.(m3u8|mpd|aac|pls)(\?.*)?$/i.test(reqUrl)
  );

  if (isRangeRequest || isMediaDestination || isLiveStreamUrl) {
    // Permitir que el navegador maneje la conexión directa nativa
    return;
  }

  // 3. Caché Especial Offline para la Biblia Interactiva (data/bible local y bolls.life)
  if (reqUrl.includes('data/bible/') || reqUrl.includes('bolls.life/get-chapter') || reqUrl.includes('bolls.life/get-books')) {
    event.respondWith(
      caches.open(BIBLE_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
            return networkResponse;
          }
        } catch (netErr) {
          const cachedResponse = await cache.match(req);
          if (cachedResponse) return cachedResponse;
        }
        const fallback = await cache.match(req);
        return fallback || fetch(req);
      })
    );
    return;
  }

  // 4a. Network-first para JS de app (parches de seguridad sin quedarse en SW viejo)
  const isAppScript = (
    req.destination === 'script' ||
    /\/js\/(app|admin|admin-cms|security|pwa|schema|firebase-config)\.js(\?.*)?$/i.test(reqUrl)
  );
  if (isAppScript) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          return (await cache.match(req)) || new Response('', { status: 408, statusText: 'Request Timeout' });
        }
      })
    );
    return;
  }

  // 4b. CACHE FIRST para estáticos (CSS, imágenes, fuentes, CDNs)
  const isStaticAsset = (
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.destination === 'font' ||
    /\.(css|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|eot)(\?.*)?$/i.test(reqUrl) ||
    reqUrl.includes('fonts.googleapis.com') ||
    reqUrl.includes('fonts.gstatic.com') ||
    reqUrl.includes('cdnjs.cloudflare.com') ||
    reqUrl.includes('ka-f.fontawesome.com')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) {
          return cached;
        }
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          return cache.match(req) || new Response('', { status: 408, statusText: 'Request Timeout' });
        }
      })
    );
    return;
  }

  // 5. ESTRATEGIA: STALE WHILE REVALIDATE para contenido dinámico y páginas
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(req);

      // Fetch en segundo plano para revalidar y actualizar la caché
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // Si estamos offline y es navegación HTML, retornar index.html
          if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
            return (await cache.match('./index.html')) || (await cache.match('./'));
          }
          return null;
        });

      if (cachedResponse) {
        return cachedResponse;
      }

      const response = await fetchPromise;
      if (response) return response;

      // Fallback offline final para navegación
      if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
        return (await cache.match('./index.html')) || (await cache.match('./'));
      }
      return new Response('Sin conexión a Internet', { status: 503, statusText: 'Offline' });
    })
  );
});

// Push Notifications desde servidor
self.addEventListener('push', (event) => {
  let data = {
    title: '🔴 ¡Culto en Vivo en RadioVisión RTV!',
    body: 'El servicio está por comenzar. Toca aquí para unirte a la transmisión en directo.',
    url: './#culto-en-vivo'
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: './img/logo-radio.jpg',
    badge: './img/logo-radio.jpg',
    vibrate: [300, 100, 300],
    data: { url: data.url || './#culto-en-vivo' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic en notificación: enfocar ventana o abrir URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './#culto-en-vivo';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('radiovision') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
