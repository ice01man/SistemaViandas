import webpush from "web-push";
import { db } from "./db";

/**
 * Envío de notificaciones Web Push (base para la PWA).
 * Requiere claves VAPID en el entorno (generarlas con `pnpm push:vapid`).
 * Si no están configuradas, todo el envío se saltea en silencio y el sistema
 * sigue funcionando solo con las notificaciones internas (campanita).
 */
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

export const pushConfigurado = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

if (pushConfigurado) {
  webpush.setVapidDetails("mailto:contacto@brie.com.ar", VAPID_PUBLIC, VAPID_PRIVATE);
}

export function clavePublicaVapid(): string | null {
  return pushConfigurado ? VAPID_PUBLIC : null;
}

export type PushPayload = {
  titulo: string;
  mensaje: string;
  url?: string;
  /** Agrupa notificaciones del mismo tema (reemplaza la anterior en el SO). */
  tag?: string;
};

/**
 * Envía un push a todos los navegadores suscriptos de los usuarios dados.
 * Best effort: nunca lanza; las suscripciones vencidas (404/410) se eliminan.
 */
export async function enviarPush(userIds: number[], payload: PushPayload) {
  if (!pushConfigurado || userIds.length === 0) return;

  const suscripciones = await db.pushSuscripcion.findMany({
    where: { userId: { in: userIds } },
  });
  if (suscripciones.length === 0) return;

  const cuerpo = JSON.stringify(payload);
  await Promise.allSettled(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          cuerpo,
          { TTL: 60 * 60 } // si el dispositivo está offline, vale por 1 hora
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // Suscripción vencida o dada de baja por el navegador: se limpia
        if (status === 404 || status === 410) {
          await db.pushSuscripcion.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    })
  );
}
