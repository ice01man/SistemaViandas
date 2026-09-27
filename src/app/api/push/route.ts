import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { clavePublicaVapid } from "@/lib/push";

/** GET: clave pública VAPID para que el navegador pueda suscribirse. */
export async function GET() {
  return NextResponse.json({ clave: clavePublicaVapid() });
}

/** POST: registra (o reasigna) la suscripción push de este navegador. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const cuerpo = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!cuerpo.endpoint || !cuerpo.keys?.p256dh || !cuerpo.keys?.auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  // Un mismo navegador puede cambiar de usuario: el endpoint pasa al último
  await db.pushSuscripcion.upsert({
    where: { endpoint: cuerpo.endpoint },
    update: { userId: session.id, p256dh: cuerpo.keys.p256dh, auth: cuerpo.keys.auth },
    create: {
      userId: session.id,
      endpoint: cuerpo.endpoint,
      p256dh: cuerpo.keys.p256dh,
      auth: cuerpo.keys.auth,
    },
  });
  return NextResponse.json({ ok: true });
}

/** DELETE: da de baja la suscripción de este navegador. */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { endpoint } = (await request.json()) as { endpoint?: string };
  if (endpoint) {
    await db.pushSuscripcion.deleteMany({ where: { endpoint, userId: session.id } });
  }
  return NextResponse.json({ ok: true });
}
