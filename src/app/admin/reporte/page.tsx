import Link from "next/link";
import { db } from "@/lib/db";
import { hoy, fmtFecha } from "@/lib/fechas";
import { fmtPrecio, ESTADO_LABEL, PAGO_LABEL, ZONA_LABEL } from "@/lib/constants";
import PrintButton from "@/components/PrintButton";
import { IconLightbulb } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminReportePage(props: PageProps<"/admin/reporte">) {
  const searchParams = await props.searchParams;
  const fecha = typeof searchParams.fecha === "string" ? searchParams.fecha : hoy();

  const [pedidos, menus] = await Promise.all([
    db.pedido.findMany({
      where: { fechaEntrega: fecha },
      include: {
        cliente: true,
        items: { include: { menuDia: { include: { vianda: true } } } },
      },
      orderBy: { id: "asc" },
    }),
    db.menuDia.findMany({
      where: { fecha },
      include: {
        vianda: true,
        items: { where: { pedido: { estado: { not: "CANCELADO" } } }, select: { cantidad: true } },
      },
    }),
  ]);

  const activos = pedidos.filter((p) => p.estado !== "CANCELADO");
  const cancelados = pedidos.length - activos.length;
  const ingresos = activos.reduce((a, p) => a + p.total, 0);
  const cobrado = activos
    .filter((p) => p.estadoPago === "CONFIRMADO")
    .reduce((a, p) => a + p.total, 0);
  const entregados = activos.filter((p) => p.estado === "ENTREGADO").length;
  const noEntregados = activos.filter((p) => p.estado === "NO_ENTREGADO").length;
  const viandas = activos.reduce((a, p) => a + p.items.reduce((x, i) => x + i.cantidad, 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brie-violet-deep">Reporte de cierre del día</h1>
          <p className="mt-1 capitalize text-foreground/70">{fmtFecha(fecha)}</p>
        </div>
        <div className="no-print flex items-center gap-2">
          <form className="flex items-center gap-2">
            <input className="input w-40" type="date" name="fecha" defaultValue={fecha} />
            <button className="btn-outline text-xs">Ver fecha</button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Pedidos</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-violet-deep">{activos.length}</p>
          <p className="text-sm text-foreground/60">
            {viandas} viandas · {cancelados} cancelados
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Facturado</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-orange">{fmtPrecio(ingresos)}</p>
          <p className="text-sm text-foreground/60">del día</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Cobrado</p>
          <p className="mt-1 text-3xl font-extrabold text-green-600">{fmtPrecio(cobrado)}</p>
          <p className="text-sm text-foreground/60">pendiente: {fmtPrecio(ingresos - cobrado)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Entregas</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-violet-deep">
            {entregados}/{activos.length}
          </p>
          <p className="text-sm text-foreground/60">{noEntregados} no entregados</p>
        </div>
      </div>

      {/* Producción */}
      <div className="card mt-6">
        <h2 className="text-lg font-extrabold text-brie-violet-deep">Producción</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
              <th className="py-2">Vianda</th>
              <th className="py-2 text-center">Vendidas</th>
              <th className="py-2 text-center">Cupo</th>
              <th className="py-2 text-center">% ocupación</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m) => {
              const vendidas = m.items.reduce((a, i) => a + i.cantidad, 0);
              return (
                <tr key={m.id} className="border-b border-brie-lavender-light/60">
                  <td className="py-2 font-semibold">{m.vianda.nombre}</td>
                  <td className="py-2 text-center font-extrabold">{vendidas}</td>
                  <td className="py-2 text-center text-foreground/60">{m.cupo}</td>
                  <td className="py-2 text-center">{m.cupo ? Math.round((vendidas / m.cupo) * 100) : 0}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detalle de pedidos */}
      <div className="card mt-6 overflow-x-auto">
        <h2 className="text-lg font-extrabold text-brie-violet-deep">Detalle de pedidos</h2>
        <table className="mt-3 w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
              <th className="py-2">#</th>
              <th className="py-2">Cliente</th>
              <th className="py-2">Zona</th>
              <th className="py-2">Viandas</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2">Pago</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className="border-b border-brie-lavender-light/60">
                <td className="py-2">{p.id}</td>
                <td className="py-2 font-semibold">{p.cliente.nombre}</td>
                <td className="py-2 text-foreground/60">{ZONA_LABEL[p.zona]}</td>
                <td className="py-2 text-foreground/70">
                  {p.items.map((i) => `${i.cantidad}× ${i.menuDia.vianda.nombre}`).join(", ")}
                </td>
                <td className="py-2 text-right font-bold">{fmtPrecio(p.total)}</td>
                <td className="py-2">{PAGO_LABEL[p.estadoPago]}</td>
                <td className="py-2">{ESTADO_LABEL[p.estado]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pedidos.length === 0 && (
          <p className="mt-3 text-center text-sm text-foreground/60">Sin pedidos en esta fecha.</p>
        )}
      </div>

      <p className="no-print mt-4 flex items-center gap-1.5 text-xs text-foreground/60">
        <IconLightbulb className="h-4 w-4 shrink-0" /> Consultá otras fechas desde el selector, o{" "}
        <Link href="/admin/pedidos" className="font-bold text-brie-violet hover:underline">
          gestioná los pedidos acá
        </Link>
        .
      </p>
    </>
  );
}
