"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import {
  avisarStockBajo,
  notificarCadetesZona,
  notificarRol,
  notificarUsuarios,
} from "@/lib/notificaciones";
import { ZONA_LABEL } from "@/lib/constants";

function revalidarOperaciones() {
  revalidatePath("/cocina");
  revalidatePath("/delivery");
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/insumos");
  revalidatePath("/mis-pedidos");
}

// ---------- Cocina ----------

/**
 * Confirma la cocción de una vianda del día: descuenta los insumos de la receta
 * según la cantidad realmente pedida (comanda) y marca la producción como lista.
 */
export async function confirmarCoccion(formData: FormData) {
  await requireRol("COCINA", "ADMIN");
  const menuDiaId = Number(formData.get("menuDiaId"));

  const menu = await db.menuDia.findUnique({
    where: { id: menuDiaId },
    include: {
      vianda: { include: { receta: { include: { ingrediente: true } } } },
      items: { where: { pedido: { estado: { not: "CANCELADO" } } }, select: { cantidad: true } },
    },
  });
  if (!menu || menu.producido) return;

  const cantidad = menu.items.reduce((a, i) => a + i.cantidad, 0);

  await db.$transaction([
    ...menu.vianda.receta.map((r) =>
      db.ingrediente.update({
        where: { id: r.ingredienteId },
        data: { stock: { decrement: r.cantidad * cantidad } },
      })
    ),
    db.menuDia.update({ where: { id: menuDiaId }, data: { producido: true } }),
  ]);

  // Aviso de reposición para los insumos que cruzaron su stock mínimo
  await avisarStockBajo(
    menu.vianda.receta.map((r) => ({
      nombre: r.ingrediente.nombre,
      unidad: r.ingrediente.unidad,
      stockAntes: r.ingrediente.stock,
      stockAhora: r.ingrediente.stock - r.cantidad * cantidad,
      stockMinimo: r.ingrediente.stockMinimo,
    }))
  );

  revalidarOperaciones();
}

/** Pasa todos los pedidos confirmados del día a "En preparación". */
export async function iniciarPreparacion(formData: FormData) {
  await requireRol("COCINA", "ADMIN");
  const fecha = String(formData.get("fecha") ?? "");
  const pedidos = await db.pedido.findMany({
    where: { fechaEntrega: fecha, estado: "CONFIRMADO" },
    select: { id: true, clienteId: true },
  });
  await db.pedido.updateMany({
    where: { fechaEntrega: fecha, estado: "CONFIRMADO" },
    data: { estado: "EN_PREPARACION" },
  });
  for (const p of pedidos) {
    await notificarUsuarios([p.clienteId], {
      tipo: "PEDIDO_EN_PREPARACION",
      titulo: "Tu pedido entró en cocina",
      mensaje: `Estamos preparando tu pedido #${p.id}. Te avisamos cuando salga en camino.`,
      url: "/mis-pedidos",
      pedidoId: p.id,
    });
  }
  revalidarOperaciones();
}

/** Marca un pedido como preparado (listo para Reparto). */
export async function marcarPreparado(formData: FormData) {
  await requireRol("COCINA", "ADMIN");
  const id = Number(formData.get("id"));
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || !["CONFIRMADO", "EN_PREPARACION"].includes(pedido.estado)) return;
  await db.pedido.update({ where: { id }, data: { estado: "PREPARADO" } });

  await notificarUsuarios([pedido.clienteId], {
    tipo: "PEDIDO_PREPARADO",
    titulo: "Tu pedido está listo",
    mensaje: `Tu pedido #${pedido.id} ya salió de cocina y pronto va a estar en camino.`,
    url: "/mis-pedidos",
    pedidoId: pedido.id,
  });

  // Avisa a los cadetes de la zona que hay un pedido listo para retirar
  await notificarCadetesZona(pedido.zona, pedido.cadeteId, {
    tipo: "PEDIDO_PREPARADO",
    titulo: "Pedido listo para retirar",
    mensaje: `El pedido #${pedido.id} (${ZONA_LABEL[pedido.zona] ?? pedido.zona} · ${pedido.direccion}) ya está listo en cocina.`,
    url: "/delivery",
    pedidoId: pedido.id,
  });

  revalidarOperaciones();
}

// ---------- Reparto ----------

/** El cadete toma el pedido y lo marca "en camino" (dispara la notificación al cliente). */
export async function marcarEnCamino(formData: FormData) {
  const session = await requireRol("DELIVERY", "ADMIN");
  const id = Number(formData.get("id"));
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || pedido.estado !== "PREPARADO") return;
  await db.pedido.update({
    where: { id },
    data: {
      estado: "EN_CAMINO",
      cadeteId: pedido.cadeteId ?? (session.rol === "DELIVERY" ? session.id : null),
    },
  });

  await notificarUsuarios([pedido.clienteId], {
    tipo: "PEDIDO_EN_CAMINO",
    titulo: "¡Tu pedido salió!",
    mensaje: `${session.nombre.split(" ")[0]} va en camino con tu pedido #${pedido.id} a ${pedido.direccion}.`,
    url: "/mis-pedidos",
    pedidoId: pedido.id,
  });

  revalidarOperaciones();
}

/**
 * El cadete avisa que está por llegar (a metros del domicilio).
 * Complementa el seguimiento por ubicación compartida.
 */
export async function avisarLlegando(formData: FormData) {
  await requireRol("DELIVERY", "ADMIN");
  const id = Number(formData.get("id"));
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || pedido.estado !== "EN_CAMINO") return;

  await notificarUsuarios([pedido.clienteId], {
    tipo: "PEDIDO_LLEGANDO",
    titulo: "¡Tu pedido está llegando!",
    mensaje: `El cadete está por llegar a ${pedido.direccion} con tu pedido #${pedido.id}.`,
    url: "/mis-pedidos",
    pedidoId: pedido.id,
  });

  revalidarOperaciones();
}

export async function marcarEntregado(formData: FormData) {
  const session = await requireRol("DELIVERY", "ADMIN");
  const id = Number(formData.get("id"));
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || pedido.estado !== "EN_CAMINO") return;
  await db.pedido.update({ where: { id }, data: { estado: "ENTREGADO" } });

  await notificarUsuarios([pedido.clienteId], {
    tipo: "PEDIDO_ENTREGADO",
    titulo: "Pedido entregado",
    mensaje: `Tu pedido #${pedido.id} fue entregado. ¡Buen provecho!`,
    url: "/mis-pedidos",
    pedidoId: pedido.id,
  });
  await notificarRol(["ADMIN"], {
    tipo: "PEDIDO_ENTREGADO",
    titulo: `Pedido #${pedido.id} entregado`,
    mensaje: `${session.nombre} entregó el pedido en ${pedido.direccion} (${ZONA_LABEL[pedido.zona] ?? pedido.zona}).`,
    url: "/admin/pedidos",
    pedidoId: pedido.id,
  });

  revalidarOperaciones();
}

/** Cliente ausente o rechazo: queda registrado para reprogramar desde Administración. */
export async function marcarNoEntregado(formData: FormData) {
  const session = await requireRol("DELIVERY", "ADMIN");
  const id = Number(formData.get("id"));
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || !["EN_CAMINO", "PREPARADO"].includes(pedido.estado)) return;
  await db.pedido.update({ where: { id }, data: { estado: "NO_ENTREGADO" } });

  await notificarUsuarios([pedido.clienteId], {
    tipo: "PEDIDO_NO_ENTREGADO",
    titulo: "No pudimos entregar tu pedido",
    mensaje: `No encontramos a nadie en ${pedido.direccion} para el pedido #${pedido.id}. Nos vamos a contactar para reprogramar.`,
    url: "/mis-pedidos",
    pedidoId: pedido.id,
  });
  await notificarRol(["ADMIN"], {
    tipo: "PEDIDO_NO_ENTREGADO",
    titulo: `Pedido #${pedido.id} sin entregar`,
    mensaje: `${session.nombre} no pudo entregar en ${pedido.direccion}. Hay que reprogramar con el cliente.`,
    url: "/admin/pedidos",
    pedidoId: pedido.id,
  });

  revalidarOperaciones();
}
