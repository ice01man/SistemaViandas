"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRol, setConfig } from "@/lib/auth";
import { notificarCadetesZona, notificarUsuarios } from "@/lib/notificaciones";
import { ZONA_LABEL, fmtPrecio } from "@/lib/constants";

function revalidarAdmin() {
  revalidatePath("/admin");
  revalidatePath("/menu");
  revalidatePath("/pedir");
  revalidatePath("/cocina");
  revalidatePath("/delivery");
  revalidatePath("/mis-pedidos");
}

// ---------- Viandas y recetas ----------

export async function guardarVianda(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id") || 0);
  const data = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "GOURMET"),
    activa: formData.get("activa") === "on",
  };
  if (!data.nombre) return;
  if (id) await db.vianda.update({ where: { id }, data });
  else await db.vianda.create({ data });
  revalidarAdmin();
}

export async function eliminarVianda(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const enUso = await db.menuDia.count({ where: { viandaId: id } });
  if (enUso > 0) {
    // Con historial asociado no se borra: se desactiva
    await db.vianda.update({ where: { id }, data: { activa: false } });
  } else {
    await db.vianda.delete({ where: { id } });
  }
  revalidarAdmin();
}

export async function guardarRecetaItem(formData: FormData) {
  await requireRol("ADMIN");
  const viandaId = Number(formData.get("viandaId"));
  const ingredienteId = Number(formData.get("ingredienteId"));
  const cantidad = Number(formData.get("cantidad"));
  if (!viandaId || !ingredienteId || !(cantidad > 0)) return;
  await db.recetaItem.upsert({
    where: { viandaId_ingredienteId: { viandaId, ingredienteId } },
    update: { cantidad },
    create: { viandaId, ingredienteId, cantidad },
  });
  revalidarAdmin();
}

export async function eliminarRecetaItem(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  await db.recetaItem.delete({ where: { id } });
  revalidarAdmin();
}

// ---------- Insumos (Control de Stock) ----------

export async function guardarIngrediente(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id") || 0);
  const venc = String(formData.get("vencimiento") ?? "");
  const data = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    unidad: String(formData.get("unidad") ?? "UN"),
    stockMinimo: Number(formData.get("stockMinimo") || 0),
    vencimiento: venc ? new Date(venc + "T00:00:00") : null,
  };
  if (!data.nombre) return;
  if (id) await db.ingrediente.update({ where: { id }, data });
  else
    await db.ingrediente.create({
      data: { ...data, stock: Number(formData.get("stock") || 0) },
    });
  revalidarAdmin();
}

/** Ingreso de mercadería: suma stock y opcionalmente actualiza vencimiento. */
export async function ingresarMercaderia(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const cantidad = Number(formData.get("cantidad"));
  if (!id || !(cantidad > 0)) return;
  const venc = String(formData.get("vencimiento") ?? "");
  await db.ingrediente.update({
    where: { id },
    data: {
      stock: { increment: cantidad },
      ...(venc ? { vencimiento: new Date(venc + "T00:00:00") } : {}),
    },
  });
  revalidarAdmin();
}

export async function eliminarIngrediente(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const enRecetas = await db.recetaItem.count({ where: { ingredienteId: id } });
  if (enRecetas === 0) await db.ingrediente.delete({ where: { id } });
  revalidarAdmin();
}

// ---------- Gestión de menú (planificación) ----------

export async function publicarMenuDia(formData: FormData) {
  await requireRol("ADMIN");
  const fecha = String(formData.get("fecha") ?? "");
  const viandaId = Number(formData.get("viandaId"));
  const cupo = Number(formData.get("cupo"));
  const precioIndividuo = Number(formData.get("precioIndividuo"));
  const precioEmpresa = Number(formData.get("precioEmpresa"));
  if (!fecha || !viandaId || !(cupo > 0) || !(precioIndividuo > 0) || !(precioEmpresa > 0)) return;

  await db.menuDia.upsert({
    where: { fecha_viandaId: { fecha, viandaId } },
    update: { cupo, precioIndividuo, precioEmpresa },
    create: { fecha, viandaId, cupo, precioIndividuo, precioEmpresa },
  });
  revalidarAdmin();
}

export async function quitarMenuDia(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const conPedidos = await db.pedidoItem.count({ where: { menuDiaId: id } });
  if (conPedidos === 0) await db.menuDia.delete({ where: { id } });
  revalidarAdmin();
}

// ---------- Pedidos (control general del día) ----------

// Cambios de estado hechos desde el panel que también avisan al cliente
const AVISO_CLIENTE: Record<string, { tipo: string; titulo: string; mensaje: (id: number) => string }> = {
  EN_PREPARACION: {
    tipo: "PEDIDO_EN_PREPARACION",
    titulo: "Tu pedido entró en cocina",
    mensaje: (id) => `Estamos preparando tu pedido #${id}. Te avisamos cuando salga en camino.`,
  },
  PREPARADO: {
    tipo: "PEDIDO_PREPARADO",
    titulo: "Tu pedido está listo",
    mensaje: (id) => `Tu pedido #${id} ya salió de cocina y pronto va a estar en camino.`,
  },
  EN_CAMINO: {
    tipo: "PEDIDO_EN_CAMINO",
    titulo: "¡Tu pedido salió!",
    mensaje: (id) => `Tu pedido #${id} ya está en camino.`,
  },
  ENTREGADO: {
    tipo: "PEDIDO_ENTREGADO",
    titulo: "Pedido entregado",
    mensaje: (id) => `Tu pedido #${id} fue entregado. ¡Buen provecho!`,
  },
  NO_ENTREGADO: {
    tipo: "PEDIDO_NO_ENTREGADO",
    titulo: "No pudimos entregar tu pedido",
    mensaje: (id) => `No pudimos entregar tu pedido #${id}. Nos vamos a contactar para reprogramar.`,
  },
};

export async function setEstadoPedido(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const estado = String(formData.get("estado") ?? "");
  const anterior = await db.pedido.findUnique({ where: { id } });
  if (!anterior) return;
  const pedido = await db.pedido.update({ where: { id }, data: { estado } });

  if (anterior.estado !== estado) {
    const aviso = AVISO_CLIENTE[estado];
    if (aviso) {
      await notificarUsuarios([pedido.clienteId], {
        tipo: aviso.tipo,
        titulo: aviso.titulo,
        mensaje: aviso.mensaje(id),
        url: "/mis-pedidos",
        pedidoId: id,
      });
    }
    // Igual que cuando Cocina lo marca: los cadetes de la zona se enteran
    if (estado === "PREPARADO") {
      await notificarCadetesZona(pedido.zona, pedido.cadeteId, {
        tipo: "PEDIDO_PREPARADO",
        titulo: "Pedido listo para retirar",
        mensaje: `El pedido #${pedido.id} (${ZONA_LABEL[pedido.zona] ?? pedido.zona} · ${pedido.direccion}) ya está listo en cocina.`,
        url: "/delivery",
        pedidoId: pedido.id,
      });
    }
  }
  revalidarAdmin();
}

export async function setEstadoPago(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const estadoPago = String(formData.get("estadoPago") ?? "");
  const comprobante = String(formData.get("comprobante") ?? "").trim();
  const pedido = await db.pedido.update({
    where: { id },
    data: { estadoPago, ...(comprobante ? { comprobante } : {}) },
  });

  if (estadoPago === "CONFIRMADO") {
    await notificarUsuarios([pedido.clienteId], {
      tipo: "PAGO_CONFIRMADO",
      titulo: "Pago confirmado",
      mensaje: `Recibimos tu pago de ${fmtPrecio(pedido.total)} del pedido #${pedido.id}. ¡Gracias!`,
      url: "/mis-pedidos",
      pedidoId: pedido.id,
    });
  }
  revalidarAdmin();
}

export async function asignarCadete(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const cadeteId = Number(formData.get("cadeteId") || 0);
  const pedido = await db.pedido.update({ where: { id }, data: { cadeteId: cadeteId || null } });

  if (cadeteId) {
    await notificarUsuarios([cadeteId], {
      tipo: "CADETE_ASIGNADO",
      titulo: `Te asignaron el pedido #${pedido.id}`,
      mensaje: `Entrega en ${pedido.direccion}${pedido.piso ? `, ${pedido.piso}` : ""} (${ZONA_LABEL[pedido.zona] ?? pedido.zona}) el ${pedido.fechaEntrega}.`,
      url: "/delivery",
      pedidoId: pedido.id,
    });
  }
  revalidarAdmin();
}

// ---------- Usuarios y roles ----------

export async function crearUsuario(formData: FormData) {
  await requireRol("ADMIN");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rol = String(formData.get("rol") ?? "CLIENTE");
  const grupo = String(formData.get("grupo") ?? "INDIVIDUO");
  const zona = String(formData.get("zona") ?? "");
  if (!email || !nombre || password.length < 6) return;
  const existe = await db.user.findUnique({ where: { email } });
  if (existe) return;
  await db.user.create({
    data: {
      email,
      nombre,
      password: await bcrypt.hash(password, 10),
      rol,
      grupo,
      zona: rol === "DELIVERY" ? zona || null : null,
    },
  });
  revalidatePath("/admin/usuarios");
}

export async function actualizarUsuario(formData: FormData) {
  await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  const grupo = String(formData.get("grupo") ?? "");
  const activo = String(formData.get("activo") ?? "");
  const data: { grupo?: string; activo?: boolean } = {};
  if (grupo) data.grupo = grupo;
  if (activo) data.activo = activo === "true";
  await db.user.update({ where: { id }, data });
  revalidatePath("/admin/usuarios");
}

export async function eliminarUsuario(formData: FormData) {
  const session = await requireRol("ADMIN");
  const id = Number(formData.get("id"));
  if (!id || id === session.id) return; // nadie se elimina a sí mismo

  const [comoCliente, comoCadete] = await Promise.all([
    db.pedido.count({ where: { clienteId: id } }),
    db.pedido.count({ where: { cadeteId: id } }),
  ]);
  if (comoCliente > 0 || comoCadete > 0) {
    // Con pedidos o entregas asociados no se borra (se perdería el historial
    // de reportes y estadísticas): se desactiva y pierde acceso al sistema.
    await db.user.update({ where: { id }, data: { activo: false } });
  } else {
    await db.user.delete({ where: { id } });
  }
  revalidatePath("/admin/usuarios");
}

// ---------- Configuración ----------

export async function guardarConfiguracion(formData: FormData) {
  await requireRol("ADMIN");
  const horaCorte = String(formData.get("horaCorte") ?? "10:00");
  if (/^\d{2}:\d{2}$/.test(horaCorte)) await setConfig("horaCorte", horaCorte);
  revalidarAdmin();
  revalidatePath("/admin/config");
}
