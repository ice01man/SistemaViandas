/*
 * Service worker de Brie.
 * Hoy se encarga de las notificaciones push; cuando la app pase a PWA,
 * acá se suma el cacheo offline (precache + estrategias por ruta).
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Llega un push del servidor: se muestra la notificación del sistema
self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { mensaje: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo || "Brie", {
      body: datos.mensaje || "",
      icon: "/logo_brie.png",
      badge: "/logo_brie.png",
      tag: datos.tag || undefined, // agrupa avisos del mismo pedido
      renotify: true, // aunque reemplace uno anterior, vuelve a sonar/vibrar
      vibrate: [200, 100, 200], // Android; el sonido lo pone el sistema
      data: { url: datos.url || "/" },
    })
  );
});

// Click en la notificación: enfoca la app si está abierta o abre la URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if ("focus" in ventana) {
          ventana.navigate(url);
          return ventana.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
