// Service Worker para Push Notifications
// IMPORTANTE: Incrementar a versão sempre que houver mudanças significativas
const APP_VERSION = '7' // Incrementar este número para forçar atualização (v7: notificationclick com navigate+focus)
const CACHE_NAME = `portal-paciente-v${APP_VERSION}`
const STATIC_CACHE_NAME = `portal-paciente-static-v${APP_VERSION}`

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando versão', APP_VERSION)
  // Força o novo service worker a ativar imediatamente
  self.skipWaiting()
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando versão', APP_VERSION)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove TODOS os caches antigos
          if (cacheName.startsWith('portal-paciente-') && cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Força atualização de todas as páginas abertas
      return self.clients.claim()
    })
  )
})

// Escutar mensagens do cliente (para forçar atualização)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Recebido comando SKIP_WAITING')
    self.skipWaiting()
  }
})

// Receber mensagens push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event)

  let notificationData = {
    title: 'Portal do Paciente',
    body: '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification',
    requireInteraction: false,
    data: {}
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || '', // Corpo vazio se não especificado
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
      }
    } catch (e) {
      notificationData.body = ''
    }
  }

  // Mostrar apenas o título se o corpo estiver vazio
  const options = {
    body: notificationData.body || undefined, // undefined remove o campo body
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    data: notificationData.data,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  }

  // Remover body se estiver vazio para não mostrar "from Portal do Paciente"
  if (!notificationData.body || notificationData.body.trim() === '') {
    delete options.body
  }

  if (notificationData.actions && notificationData.actions.length > 0) {
    options.actions = notificationData.actions
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  )
})

// Clique na notificação
// Prioriza janela/aba já aberta do app (PWA ou navegador); senão abre nova janela
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event)

  event.notification.close()

  const data = event.notification.data || {}
  const urlToOpen = data.url || '/portal'
  const fullUrl = new URL(urlToOpen, self.location.origin).href

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })

      const origin = new URL(fullUrl).origin

      for (const client of windowClients) {
        if (client.url.startsWith(origin)) {
          await client.navigate(fullUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl)
      }
    })()
  )
})

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificação fechada:', event)
})

