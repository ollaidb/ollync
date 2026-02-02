self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (error) {
    payload = { title: undefined, body: event.data ? event.data.text() : '' }
  }

  const locale = (payload.lang || self.navigator.language || 'fr').toLowerCase()
  const isEnglish = locale.startsWith('en')
  const defaultTitle = isEnglish ? 'New notification' : 'Nouvelle notification'
  const title = payload.title || defaultTitle
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/vite.svg',
    badge: payload.badge || '/vite.svg',
    data: {
      url: payload.url || '/'
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
