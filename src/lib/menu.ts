import { db } from "./db";

/**
 * Menú publicado de una fecha con la disponibilidad calculada:
 * disponibles = cupo (estimado a producir) - viandas ya vendidas.
 */
export async function menuConDisponibilidad(fecha: string) {
  const menus = await db.menuDia.findMany({
    where: { fecha, vianda: { activa: true } },
    include: {
      vianda: true,
      items: {
        where: { pedido: { estado: { not: "CANCELADO" } } },
        select: { cantidad: true },
      },
    },
    orderBy: { vianda: { categoria: "asc" } },
  });

  return menus.map((m) => {
    const vendidas = m.items.reduce((acc, i) => acc + i.cantidad, 0);
    return { ...m, vendidas, disponibles: Math.max(0, m.cupo - vendidas) };
  });
}

export type MenuDelDia = Awaited<ReturnType<typeof menuConDisponibilidad>>[number];
