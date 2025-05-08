// sw.js padrão para registro de Service Worker
self.addEventListener('install', function(event) {
  // Instalação do Service Worker
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Ativação do Service Worker
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Por enquanto, não faz cache de nada
  // Pode ser expandido para PWA offline
}); 