// PRISM Connect service worker.
// Deliberately minimal: this app has no offline-caching requirements
// (it's a read-only view of live clinical data, and stale cached results
// would be actively dangerous to show a clinician). Its only job is to
// receive and display Web Push notifications, and route taps.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'PRISM Connect', body: 'New activity on a patient record.', url: '/alerts' };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon.ico',
      badge: '/icons/icon.ico',
      tag: payload.tag || undefined,
      data: { url: payload.url || '/alerts' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawTarget = event.notification.data?.url || '/alerts';

  event.waitUntil(
    (async () => {
      let target = new URL(rawTarget, self.location.origin);
      if (target.origin !== self.location.origin) {
        target = new URL('/alerts', self.location.origin);
      }

      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        const appWindow = await client.navigate(target.href);
        return (appWindow || client).focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(target.href);
      }
    })(),
  );
});
