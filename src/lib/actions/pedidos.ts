"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, getConfig } from "@/lib/auth";
import { fechasDisponibles, hoy, pasoElCorte } from "@/lib/fechas";
import { notificarRol } from "@/lib/notificaciones";
import { fmtPrecio } from "@/lib/constants";

export type PedidoFormState = { error?: string };

type ItemCarrito = { menuDiaId: number; cantidad: number };

export async function crearPedido(
  _prev: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.rol !== "CLIENTE" && session.rol !== "ADMIN")
    return { error: "Solo los clientes pueden hacer pedidos." };

  const fecha = String(formData.get("fecha") ?? "");
  const direccion = String(formData.get("direccion") ?? "").trim();
  const piso = String(formData.get("piso") ?? "").trim();
  const zona = String(formData.get("zona") ?? "");
  const observaciones = String(formData.get("observaciones") ?? "").trim();
  const metodoPago = String(formData.get("metodoPago") ?? "TRANSFERENCIA");

  let items: ItemCarrito[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "El carrito es inválido." };
  }
  items = items.filter((i) => i.cantidad > 0);

  if (!items.length) return { error: "Agregá al menos una vianda al pedido." };
  if (!direccion) return { error: "Ingresá la dirección de entrega." };
  if (!["SUR", "CENTRO", "NORTE"].includes(zona)) return { error: "Elegí la zona de entrega." };

  // Ventana de pedidos: configurable desde Administración
  const horaCorte = await getConfig("horaCorte", "10:00");
  const disponibles = fechasDisponibles(horaCorte);
  if (!disponibles.includes(fecha)) {
    return {
      error: `Los pedidos para hoy se toman hasta las ${horaCorte} hs. Elegí otra fecha disponible.`,
    };
  }

  // Validación de cupo + precios en el servidor
  const menus = await db.menuDia.findMany({
    where: { id: { in: items.map((i) => i.menuDiaId) }, fecha },
    include: {
      items: {
        where: { pedido: { estado: { not: "CANCELADO" } } },
        select: { cantidad: true },
      },
    },
  });
  if (menus.length !== items.length) return { error: "Alguna vianda ya no está en el menú del día." };

  for (const item of items) {
    const menu = menus.find((m) => m.id === item.menuDiaId)!;
    const vendidas = menu.items.reduce((acc, i) => acc + i.cantidad, 0);
    if (vendidas + item.cantidad > menu.cupo) {
      return { error: `No queda cupo suficiente (quedan ${Math.max(0, menu.cupo - vendidas)}).` };
    }
  }

  const esEmpresa = session.grupo === "EMPRESA";
  const total = items.reduce((acc, item) => {
    const menu = menus.find((m) => m.id === item.menuDiaId)!;
    return acc + item.cantidad * (esEmpresa ? menu.precioEmpresa : menu.precioIndividuo);
  }, 0);

  const pedido = await db.pedido.create({
    data: {
      clienteId: session.id,
      fechaEntrega: fecha,
      estado: "CONFIRMADO",
      estadoPago: "PENDIENTE",
      metodoPago,
      total,
      direccion,
      piso: piso || null,
      zona,
      observaciones: observaciones || null,
      items: {
        create: items.map((item) => {
          const menu = menus.find((m) => m.id === item.menuDiaId)!;
          return {
            menuDiaId: item.menuDiaId,
            cantidad: item.cantidad,
            precioUnit: esEmpresa ? menu.precioEmpresa : menu.precioIndividuo,
          };
        }),
      },
    },
  });

  const viandas = items.reduce((acc, i) => acc + i.cantidad, 0);
  const aviso = {
    tipo: "PEDIDO_NUEVO",
    titulo: `Nuevo pedido #${pedido.id}`,
    mensaje: `${session.nombre} pidió ${viandas} vianda${viandas === 1 ? "" : "s"} para el ${fecha} (${fmtPrecio(total)}).`,
    pedidoId: pedido.id,
  };
  await notificarRol(["ADMIN"], { ...aviso, url: "/admin/pedidos" });
  await notificarRol(["COCINA"], { ...aviso, url: "/cocina" });

  revalidatePath("/pedir");
  revalidatePath("/mis-pedidos");
  redirect(`/mis-pedidos?nuevo=${pedido.id}`);
}

export async function cancelarPedido(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = Number(formData.get("id"));
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || pedido.clienteId !== session.id) return;

  // Solo se puede cancelar si todavía no entró en producción y no pasó el corte del día de entrega
  const horaCorte = await getConfig("horaCorte", "10:00");
  const puedeCancelar =
    pedido.estado === "CONFIRMADO" &&
    (pedido.fechaEntrega > hoy() || !pasoElCorte(horaCorte));
  if (!puedeCancelar) return;

  await db.pedido.update({ where: { id }, data: { estado: "CANCELADO" } });

  const aviso = {
    tipo: "PEDIDO_CANCELADO",
    titulo: `Pedido #${pedido.id} cancelado`,
    mensaje: `El cliente canceló su pedido para el ${pedido.fechaEntrega}.`,
    pedidoId: pedido.id,
  };
  await notificarRol(["ADMIN"], { ...aviso, url: "/admin/pedidos" });
  await notificarRol(["COCINA"], { ...aviso, url: "/cocina" });

  revalidatePath("/mis-pedidos");
  revalidatePath("/pedir");
}

export async function informarPago(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = Number(formData.get("id"));
  const comprobante = String(formData.get("comprobante") ?? "").trim();
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || pedido.clienteId !== session.id) return;
  if (pedido.estadoPago === "CONFIRMADO") return;

  await db.pedido.update({
    where: { id },
    data: { estadoPago: "INFORMADO", comprobante: comprobante || null, metodoPago: "TRANSFERENCIA" },
  });

  await notificarRol(["ADMIN"], {
    tipo: "PAGO_INFORMADO",
    titulo: `Pago informado (pedido #${pedido.id})`,
    mensaje: `${session.nombre} informó una transferencia de ${fmtPrecio(pedido.total)}${comprobante ? ` (comprobante ${comprobante})` : ""}. Falta confirmarla.`,
    url: "/admin/pedidos",
    pedidoId: pedido.id,
  });

  revalidatePath("/mis-pedidos");
}
