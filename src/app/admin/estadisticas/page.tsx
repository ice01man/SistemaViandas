import Link from "next/link";
import { db } from "@/lib/db";
import { hoy, inicioSemana, inicioMes, haceDias, fmtFechaCorta } from "@/lib/fechas";
import { fmtPrecio, ZONA_LABEL, ZONAS_LISTA } from "@/lib/constants";
import PrintButton from "@/components/PrintButton";
import { IconLightbulb } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminEstadisticasPage(props: PageProps<"/admin/estadisticas">) {
  const searchParams = await props.searchParams;
  const esFecha = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

  // Rango: por defecto la semana en curso; presets y rango personalizado por URL.
  const desde = esFecha(searchParams.desde) ? searchParams.desde : inicioSemana();
  const hasta = esFecha(searchParams.hasta) ? searchParams.hasta : hoy();

  const presets = [
    { label: "Esta semana", desde: inicioSemana(), hasta: hoy() },
    { label: "Este mes", desde: inicioMes(), hasta: hoy() },
    { label: "Últimos 30 días", desde: haceDias(29), hasta: hoy() },
  ];

  const pedidos = await db.pedido.findMany({
    where: { fechaEntrega: { gte: desde, lte: hasta } },
    include: {
      cliente: true,
      items: { include: { menuDia: { include: { vianda: true } } } },
    },
    orderBy: { fechaEntrega: "asc" },
  });

  const activos = pedidos.filter((p) => p.estado !== "CANCELADO");
  const cancelados = pedidos.length - activos.length;
  const facturado = activos.reduce((a, p) => a + p.total, 0);
  const cobrado = activos
    .filter((p) => p.estadoPago === "CONFIRMADO")
    .reduce((a, p) => a + p.total, 0);
  const entregados = activos.filter((p) => p.estado === "ENTREGADO").length;
  const noEntregados = activos.filter((p) => p.estado === "NO_ENTREGADO").length;
  const viandas = activos.reduce((a, p) => a + p.items.reduce((x, i) => x + i.cantidad, 0), 0);
  const ticketPromedio = activos.length ? facturado / activos.length : 0;

  // Ventas por día
  const porDia = new Map<string, { pedidos: number; viandas: number; total: number }>();
  for (const p of activos) {
    const d = porDia.get(p.fechaEntrega) ?? { pedidos: 0, viandas: 0, total: 0 };
    d.pedidos += 1;
    d.viandas += p.items.reduce((x, i) => x + i.cantidad, 0);
    d.total += p.total;
    porDia.set(p.fechaEntrega, d);
  }
  const dias = [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b));
  const maxDia = Math.max(1, ...dias.map(([, d]) => d.total));

  // Ranking de viandas
  const porVianda = new Map<string, { unidades: number; total: number }>();
  for (const p of activos)
    for (const i of p.items) {
      const v = porVianda.get(i.menuDia.vianda.nombre) ?? { unidades: 0, total: 0 };
      v.unidades += i.cantidad;
      v.total += i.cantidad * i.precioUnit;
      porVianda.set(i.menuDia.vianda.nombre, v);
    }
  const rankingViandas = [...porVianda.entries()].sort((a, b) => b[1].unidades - a[1].unidades);
  const maxVianda = Math.max(1, ...rankingViandas.map(([, v]) => v.unidades));

  // Por zona
  const porZona = new Map<string, { pedidos: number; total: number }>();
  for (const p of activos) {
    const z = porZona.get(p.zona) ?? { pedidos: 0, total: 0 };
    z.pedidos += 1;
    z.total += p.total;
    porZona.set(p.zona, z);
  }

  // Mejores clientes
  const porCliente = new Map<number, { nombre: string; grupo: string; pedidos: number; total: number }>();
  for (const p of activos) {
    const c =
      porCliente.get(p.clienteId) ??
      { nombre: p.cliente.nombre, grupo: p.cliente.grupo, pedidos: 0, total: 0 };
    c.pedidos += 1;
    c.total += p.total;
    porCliente.set(p.clienteId, c);
  }
  const topClientes = [...porCliente.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  const rangoActivo = (p: { desde: string; hasta: string }) => p.desde === desde && p.hasta === hasta;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brie-violet-deep">Estadísticas</h1>
          <p className="mt-1 text-foreground/70">
            Historial de ventas y entregas del {fmtFechaCorta(desde)} al {fmtFechaCorta(hasta)}.
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Selección de rango */}
      <div className="no-print mt-4 flex flex-wrap items-end gap-2">
        {presets.map((p) => (
          <Link
            key={p.label}
            href={`/admin/estadisticas?desde=${p.desde}&hasta=${p.hasta}`}
            className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-bold ${
              rangoActivo(p)
                ? "border-transparent bg-brie-solid text-white"
                : "border-brie-lavender bg-surface text-brie-violet-dark hover:bg-brie-lavender-light"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <form className="ml-2 flex flex-wrap items-end gap-2">
          <div>
            <label className="label">Desde</label>
            <input className="input w-40" type="date" name="desde" defaultValue={desde} max={hasta} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input className="input w-40" type="date" name="hasta" defaultValue={hasta} min={desde} />
          </div>
          <button className="btn-outline">Ver rango</button>
        </form>
      </div>

      {/* Resumen del período */}
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
          <p className="mt-1 text-3xl font-extrabold text-brie-orange">{fmtPrecio(facturado)}</p>
          <p className="text-sm text-foreground/60">ticket promedio {fmtPrecio(ticketPromedio)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Cobrado</p>
          <p className="mt-1 text-3xl font-extrabold text-green-600">{fmtPrecio(cobrado)}</p>
          <p className="text-sm text-foreground/60">pendiente: {fmtPrecio(facturado - cobrado)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Entregas</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-violet-deep">
            {entregados}/{activos.length}
          </p>
          <p className="text-sm text-foreground/60">{noEntregados} no entregados</p>
        </div>
      </div>

      {/* Ventas por día */}
      <div className="card mt-6 overflow-x-auto">
        <h2 className="text-lg font-extrabold text-brie-violet-deep">Ventas por día</h2>
        {dias.length === 0 ? (
          <p className="mt-3 text-center text-sm text-foreground/60">Sin ventas en este período.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
                <th className="py-2">Día</th>
                <th className="py-2 text-center">Pedidos</th>
                <th className="py-2 text-center">Viandas</th>
                <th className="py-2 text-right">Facturado</th>
                <th className="hidden py-2 pl-4 sm:table-cell">Comparativa</th>
              </tr>
            </thead>
            <tbody>
              {dias.map(([f, d]) => (
                <tr key={f} className="border-b border-brie-lavender-light/60">
                  <td className="py-2 capitalize">
                    <Link
                      href={`/admin/reporte?fecha=${f}`}
                      className="font-semibold text-brie-violet hover:underline"
                    >
                      {fmtFechaCorta(f)}
                    </Link>
                  </td>
                  <td className="py-2 text-center">{d.pedidos}</td>
                  <td className="py-2 text-center">{d.viandas}</td>
                  <td className="py-2 text-right font-bold">{fmtPrecio(d.total)}</td>
                  <td className="hidden w-1/3 py-2 pl-4 sm:table-cell">
                    <div className="h-2.5 rounded-full bg-brie-lavender-light/60">
                      <div
                        className="h-2.5 rounded-full bg-brie-solid"
                        style={{ width: `${Math.max(3, Math.round((d.total / maxDia) * 100))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Viandas más vendidas */}
        <div className="card">
          <h2 className="text-lg font-extrabold text-brie-violet-deep">Viandas más vendidas</h2>
          {rankingViandas.length === 0 ? (
            <p className="mt-3 text-center text-sm text-foreground/60">Sin datos.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {rankingViandas.map(([nombre, v]) => (
                <div key={nombre}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{nombre}</span>
                    <span className="text-foreground/60">
                      {v.unidades} u. · {fmtPrecio(v.total)}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-brie-lavender-light/60">
                    <div
                      className="h-2.5 rounded-full bg-brie-orange"
                      style={{ width: `${Math.max(3, Math.round((v.unidades / maxVianda) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Por zona */}
          <div className="card">
            <h2 className="text-lg font-extrabold text-brie-violet-deep">Por zona de entrega</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
              {ZONAS_LISTA.map((z) => {
                const d = porZona.get(z) ?? { pedidos: 0, total: 0 };
                return (
                  <div key={z} className="rounded-xl bg-brie-lavender-soft p-3">
                    <p className="text-xs font-bold uppercase text-brie-violet">{ZONA_LABEL[z]}</p>
                    <p className="mt-1 text-2xl font-extrabold text-brie-violet-deep">{d.pedidos}</p>
                    <p className="text-sm text-foreground/60">{fmtPrecio(d.total)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mejores clientes */}
          <div className="card">
            <h2 className="text-lg font-extrabold text-brie-violet-deep">Mejores clientes</h2>
            {topClientes.length === 0 ? (
              <p className="mt-3 text-center text-sm text-foreground/60">Sin datos.</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
                    <th className="py-2">Cliente</th>
                    <th className="py-2 text-center">Pedidos</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientes.map((c) => (
                    <tr key={c.nombre} className="border-b border-brie-lavender-light/60">
                      <td className="py-2 font-semibold">
                        {c.nombre}
                        {c.grupo === "EMPRESA" && (
                          <span className="badge ml-2 bg-brie-orange-light text-brie-orange-dark">
                            Empresa
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center">{c.pedidos}</td>
                      <td className="py-2 text-right font-bold">{fmtPrecio(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <p className="no-print mt-4 flex items-center gap-1.5 text-xs text-foreground/60">
        <IconLightbulb className="h-4 w-4 shrink-0" /> Hacé clic en un día para abrir su{" "}
        <Link href="/admin/reporte" className="font-bold text-brie-violet hover:underline">
          reporte de cierre
        </Link>{" "}
        completo.
      </p>
    </>
  );
}
