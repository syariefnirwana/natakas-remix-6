// Minimal worker used only to display notifications (required on Android Chrome). No caching.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      if (list[0]) return list[0].focus();
      return self.clients.openWindow("/dashboard");
    }),
  );
});
