import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET: últimas notificaciones del usuario + cantidad sin leer (para la campanita). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const [notificaciones, noLeidas] = await Promise.all([
    db.notificacion.findMany({
      where: { userId: session.id },
      orderBy: { id: "desc" },
      take: 10,
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensaje: true,
        url: true,
        leida: true,
        createdAt: true,
      },
    }),
    db.notificacion.count({ where: { userId: session.id, leida: false } }),
  ]);

  return NextResponse.json({ notificaciones, noLeidas });
}

/** POST: marca como leídas (ids puntuales o todas). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const cuerpo = (await request.json()) as { ids?: number[]; todas?: boolean };
  await db.notificacion.updateMany({
    where: {
      userId: session.id,
      leida: false,
      ...(cuerpo.todas ? {} : { id: { in: (cuerpo.ids ?? []).map(Number) } }),
    },
    data: { leida: true },
  });
  return NextResponse.json({ ok: true });
}
