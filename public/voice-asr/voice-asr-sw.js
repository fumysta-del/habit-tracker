const CACHE_NAME = 'habit-voice-asr-v2';

const CACHE_FILES = new Set([
  'sherpa-onnx-wasm-main-vad-asr.data',
  'sherpa-onnx-wasm-main-vad-asr.wasm',
  'sherpa-onnx-wasm-main-vad-asr.js',
  'sherpa-onnx-asr.js',
  'sherpa-onnx-vad.js',
  'app-vad-asr.js'
]);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name => name.startsWith('habit-voice-asr-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const filename = url.pathname.split('/').pop();

  if (
    url.origin !== self.location.origin ||
    !CACHE_FILES.has(filename)
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const cached = await cache.match(event.request, {
        ignoreSearch: true
      });

      if (cached) {
        console.log('[Voice ASR] cache hit:', filename);
        return cached;
      }

      console.log('[Voice ASR] downloading:', filename);

      const response = await fetch(event.request);

      if (response.ok) {
        // 关键：不要等待缓存完成。
        // 先立即把 response 交给 sherpa，同时后台写缓存。
        cache.put(event.request, response.clone())
          .then(() => {
            console.log('[Voice ASR] cached:', filename);
          })
          .catch((err) => {
            console.error('[Voice ASR] cache failed:', filename, err);
          });
      }

      return response;
    })()
  );
});