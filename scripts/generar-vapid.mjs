// Genera el par de claves VAPID para las notificaciones push.
// Correr con `pnpm push:vapid` y pegar la salida en el archivo .env.
import webpush from "web-push";

const claves = webpush.generateVAPIDKeys();
console.log("Agregá estas líneas al .env (reemplazando las anteriores si existen):\n");
console.log(`VAPID_PUBLIC_KEY="${claves.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${claves.privateKey}"`);
