/**
 * Limpia y desregistra Service Workers y almacenes obsoletos de Cache API,
 * garantizando que el navegador utilice directamente la caché HTTP nativa de disco y memoria.
 */
export function cleanupServiceWorkers(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.startsWith('vetbol-images-')) {
            caches.delete(key)
          }
        }
      })
    }
  }
}
