export const ROLES = {
  CLIENTE: "CLIENTE",
  ADMIN: "ADMIN",
  COCINA: "COCINA",
  DELIVERY: "DELIVERY",
} as const;

export const GRUPOS = {
  INDIVIDUO: "INDIVIDUO",
  EMPRESA: "EMPRESA",
} as const;

export const ZONAS = {
  SUR: "SUR",
  CENTRO: "CENTRO",
  NORTE: "NORTE",
} as const;

/** Zonas de entrega en orden de presentación. */
export const ZONAS_LISTA = ["SUR", "CENTRO", "NORTE"] as const;

export const ZONA_LABEL: Record<string, string> = {
  SUR: "Zona Sur",
  CENTRO: "Zona Centro",
  NORTE: "Zona Norte",
};

export const CATEGORIAS = {
  GOURMET: "GOURMET",
  VEGETARIANO: "VEGETARIANO",
  ENSALADA: "ENSALADA",
} as const;

export const CATEGORIA_LABEL: Record<string, string> = {
  GOURMET: "Gourmet",
  VEGETARIANO: "Vegetariano",
  ENSALADA: "Ensalada",
};

export const ESTADOS_PEDIDO = [
  "CONFIRMADO",
  "EN_PREPARACION",
  "PREPARADO",
  "EN_CAMINO",
  "ENTREGADO",
  "NO_ENTREGADO",
  "CANCELADO",
] as const;

export const ESTADO_LABEL: Record<string, string> = {
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  PREPARADO: "Preparado",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  NO_ENTREGADO: "No entregado",
  CANCELADO: "Cancelado",
};

export const ESTADO_COLOR: Record<string, string> = {
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EN_PREPARACION: "bg-amber-100 text-amber-800",
  PREPARADO: "bg-violet-100 text-violet-800",
  EN_CAMINO: "bg-orange-100 text-orange-800",
  ENTREGADO: "bg-green-100 text-green-800",
  NO_ENTREGADO: "bg-red-100 text-red-800",
  CANCELADO: "bg-gray-200 text-gray-600",
};

export const ESTADOS_PAGO = ["PENDIENTE", "INFORMADO", "CONFIRMADO"] as const;

export const PAGO_LABEL: Record<string, string> = {
  PENDIENTE: "Pago pendiente",
  INFORMADO: "Pago informado",
  CONFIRMADO: "Pago confirmado",
};

export const PAGO_COLOR: Record<string, string> = {
  PENDIENTE: "bg-red-100 text-red-700",
  INFORMADO: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-green-100 text-green-800",
};

/** Tipos de notificación del sistema (campanita + push). */
export const TIPOS_NOTIFICACION = [
  "PEDIDO_NUEVO",
  "PEDIDO_EN_PREPARACION",
  "PEDIDO_PREPARADO",
  "PEDIDO_EN_CAMINO",
  "PEDIDO_LLEGANDO",
  "PEDIDO_ENTREGADO",
  "PEDIDO_NO_ENTREGADO",
  "PEDIDO_CANCELADO",
  "PAGO_INFORMADO",
  "PAGO_CONFIRMADO",
  "STOCK_BAJO",
  "CADETE_ASIGNADO",
] as const;

export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

export const UNIDADES = ["UN", "KG", "G", "L", "ML"] as const;

/** Nombre completo de cada unidad (para selects). */
export const UNIDAD_NOMBRE: Record<string, string> = {
  UN: "Unidad",
  KG: "Kilos",
  G: "Gramos",
  L: "Litros",
  ML: "Mililitros",
};

/** Abreviatura visible de cada unidad. */
export const UNIDAD_LABEL: Record<string, string> = {
  UN: "UN",
  KG: "Kg",
  G: "Gr",
  L: "Lts",
  ML: "Ml",
};

/** "37,50 Kg": cantidad formateada con su unidad abreviada. */
export function fmtUnidad(n: number, unidad: string) {
  return `${fmtCantidad(n)} ${UNIDAD_LABEL[unidad] ?? unidad}`;
}

export function fmtPrecio(n: number) {
  return "$" + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

/** Cantidades con coma decimal (es-AR): 37.5 → "37,50", 30 → "30". */
export function fmtCantidad(n: number) {
  return n.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}
