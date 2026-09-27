"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRol } from "@/lib/auth";

/** Marca todas las notificaciones del usuario como leídas (página /notificaciones). */
export async function marcarTodasLeidas() {
  const session = await requireRol();
  await db.notificacion.updateMany({
    where: { userId: session.id, leida: false },
    data: { leida: true },
  });
  revalidatePath("/notificaciones");
}

/** Borra las notificaciones ya leídas del usuario. */
export async function limpiarLeidas() {
  const session = await requireRol();
  await db.notificacion.deleteMany({ where: { userId: session.id, leida: true } });
  revalidatePath("/notificaciones");
}

/**
 * El cadete comparte su ubicación mientras reparte: el cliente con un pedido
 * en camino puede seguirlo desde "Mis pedidos".
 */
export async function actualizarUbicacion(lat: number, lng: number) {
  const session = await requireRol("DELIVERY", "ADMIN");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  await db.user.update({
    where: { id: session.id },
    data: { ubicacionLat: lat, ubicacionLng: lng, ubicacionAt: new Date() },
  });
}

/** Deja de compartir la ubicación (al apagar el toggle o cerrar el reparto). */
export async function apagarUbicacion() {
  const session = await requireRol("DELIVERY", "ADMIN");
  await db.user.update({
    where: { id: session.id },
    data: { ubicacionLat: null, ubicacionLng: null, ubicacionAt: null },
  });
}
