// Desregistro automático del Service Worker para evitar interferencias
// y permitir que el navegador use su caché HTTP nativa de alta velocidad.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll()
    }).then((clients) => {
      clients.forEach((client) => {
        // Notificar a los clientes abiertos
      })
    })
  )
})
