// Service Worker para Push Notifications
// IMPORTANTE: Incrementar a versão sempre que houver mudanças significativas
const APP_VERSION = '6' // Incrementar este número para forçar atualização
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
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event)

  event.notification.close()

  const data = event.notification.data || {}
  const urlToOpen = data.url || '/portal'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Abrir nova janela se não houver nenhuma aberta
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificação fechada:', event)
})

