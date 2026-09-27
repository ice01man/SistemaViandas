"use client";

/**
 * Helpers del navegador para las notificaciones push.
 * Registran el service worker (`public/sw.js`), gestionan el permiso y
 * sincronizan la suscripción con el servidor (/api/push).
 */

export type EstadoPush = "no-soportado" | "sin-clave" | "denegado" | "activo" | "inactivo";

function soportaPush() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** La clave pública VAPID viene en base64url; el navegador la quiere en bytes. */
function base64UrlABytes(base64Url: string): Uint8Array {
  const relleno = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

async function registrarSW(): Promise<ServiceWorkerRegistration> {
  const registro = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return registro;
}

/** Estado actual del push en este navegador. */
export async function estadoPush(): Promise<EstadoPush> {
  if (!soportaPush()) return "no-soportado";
  if (Notification.permission === "denied") return "denegado";
  try {
    const registro = await navigator.serviceWorker.getRegistration("/sw.js");
    const suscripcion = await registro?.pushManager.getSubscription();
    return suscripcion ? "activo" : "inactivo";
  } catch {
    return "inactivo";
  }
}

/** Pide permiso, suscribe este navegador y lo registra en el servidor. */
export async function activarPush(): Promise<EstadoPush> {
  if (!soportaPush()) return "no-soportado";

  const respuestaClave = await fetch("/api/push");
  const { clave } = (await respuestaClave.json()) as { clave: string | null };
  if (!clave) return "sin-clave";

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") return "denegado";

  const registro = await registrarSW();
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlABytes(clave) as BufferSource,
    }));

  await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(suscripcion.toJSON()),
  });
  return "activo";
}

/** Da de baja la suscripción de este navegador. */
export async function desactivarPush(): Promise<EstadoPush> {
  if (!soportaPush()) return "no-soportado";
  const registro = await navigator.serviceWorker.getRegistration("/sw.js");
  const suscripcion = await registro?.pushManager.getSubscription();
  if (suscripcion) {
    await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: suscripcion.endpoint }),
    });
    await suscripcion.unsubscribe();
  }
  return "inactivo";
}
