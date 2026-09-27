import {
  IconDashboard,
  IconReceipt,
  IconCalendar,
  IconPot,
  IconPackage,
  IconCart,
  IconUsers,
  IconClipboardCheck,
  IconChart,
  IconSettings,
} from "@/components/icons";

/** Secciones del panel de administración (sidebar de escritorio y barra mobile). */
export const SECCIONES_ADMIN = [
  { href: "/admin", label: "Panel del día", icono: IconDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icono: IconReceipt },
  { href: "/admin/menu", label: "Menú semanal", icono: IconCalendar },
  { href: "/admin/viandas", label: "Viandas y recetas", icono: IconPot },
  { href: "/admin/insumos", label: "Stock de insumos", icono: IconPackage },
  { href: "/admin/compras", label: "Lista de compras", icono: IconCart },
  { href: "/admin/usuarios", label: "Usuarios y roles", icono: IconUsers },
  { href: "/admin/reporte", label: "Cierre del día", icono: IconClipboardCheck },
  { href: "/admin/estadisticas", label: "Estadísticas", icono: IconChart },
  { href: "/admin/config", label: "Configuración", icono: IconSettings },
];
