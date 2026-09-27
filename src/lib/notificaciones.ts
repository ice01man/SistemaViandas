import { db } from "./db";
import { enviarPush } from "./push";
import { fmtUnidad } from "./constants";

/**
 * Motor de notificaciones: crea la notificación interna (campanita) y,
 * si el usuario tiene navegadores suscriptos, dispara también el Web Push.
 * Todo es best effort: un fallo acá nunca corta la operación que lo disparó.
 */

export type DatosNotificacion = {
  tipo: string; // ver TIPOS_NOTIFICACION en constants.ts
  titulo: string;
  mensaje: string;
  url?: string;
  pedidoId?: number;
};

/** Notifica a usuarios puntuales (por id). */
export async function notificarUsuarios(userIds: number[], datos: DatosNotificacion) {
  const ids = [...new Set(userIds)].filter((id) => id > 0);
  if (ids.length === 0) return;

  try {
    await db.notificacion.createMany({
      data: ids.map((userId) => ({
        userId,
        tipo: datos.tipo,
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        url: datos.url ?? null,
        pedidoId: datos.pedidoId ?? null,
      })),
    });

    await enviarPush(ids, {
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      url: datos.url,
      tag: datos.pedidoId ? `pedido-${datos.pedidoId}` : datos.tipo,
    });
  } catch (err) {
    console.error("No se pudo notificar:", err);
  }
}

/** Notifica a todos los usuarios activos que tengan alguno de los roles dados. */
export async function notificarRol(roles: string[], datos: DatosNotificacion) {
  const usuarios = await db.user.findMany({
    where: { rol: { in: roles }, activo: true },
    select: { id: true },
  });
  await notificarUsuarios(
    usuarios.map((u) => u.id),
    datos
  );
}

/** Notifica a los cadetes activos de una zona — incluyendo los que cubren todas (zona null) — más el asignado, si difiere. */
export async function notificarCadetesZona(
  zona: string,
  cadeteId: number | null,
  datos: DatosNotificacion
) {
  const cadetes = await db.user.findMany({
    where: { rol: "DELIVERY", activo: true, OR: [{ zona }, { zona: null }] },
    select: { id: true },
  });
  const ids = cadetes.map((c) => c.id);
  if (cadeteId) ids.push(cadeteId);
  await notificarUsuarios(ids, datos);
}

/**
 * Aviso de stock bajo: para cada ingrediente que CRUZÓ su mínimo con este
 * descuento (antes estaba por encima), avisa a administración y cocina
 * sugiriendo reponer. Se avisa solo al cruzar para no repetir el aviso
 * en cada cocción mientras siga bajo.
 */
export async function avisarStockBajo(
  ingredientes: { nombre: string; unidad: string; stockAntes: number; stockAhora: number; stockMinimo: number }[]
) {
  for (const ing of ingredientes) {
    if (ing.stockMinimo <= 0) continue;
    if (ing.stockAntes <= ing.stockMinimo || ing.stockAhora > ing.stockMinimo) continue;

    const datos = {
      tipo: "STOCK_BAJO",
      titulo: `Se está agotando ${ing.nombre}`,
      mensaje: `Quedan ${fmtUnidad(Math.max(0, ing.stockAhora), ing.unidad)} (mínimo ${fmtUnidad(
        ing.stockMinimo,
        ing.unidad
      )}). Conviene comprar más.`,
    };
    await notificarRol(["ADMIN"], { ...datos, url: "/admin/insumos" });
    await notificarRol(["COCINA"], { ...datos, url: "/cocina" });
  }
}
