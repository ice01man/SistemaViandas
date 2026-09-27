import Link from "next/link";
import { db } from "@/lib/db";
import { hoy, fmtFecha } from "@/lib/fechas";
import { fmtPrecio, fmtCantidad, fmtUnidad, ESTADO_LABEL, ESTADO_COLOR } from "@/lib/constants";
import { IconAlert, IconTrendingDown, IconHourglass } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const fecha = hoy();

  const [pedidos, menus, insumosBajos, insumosPorVencer] = await Promise.all([
    db.pedido.findMany({
      where: { fechaEntrega: fecha },
      include: { items: true },
    }),
    db.menuDia.findMany({
      where: { fecha },
      include: {
        vianda: true,
        items: { where: { pedido: { estado: { not: "CANCELADO" } } }, select: { cantidad: true } },
      },
    }),
    db.ingrediente.findMany({ orderBy: { nombre: "asc" } }),
    db.ingrediente.findMany({
      where: { vencimiento: { lte: new Date(Date.now() + 7 * 24 * 3600 * 1000) } },
    }),
  ]);

  const activos = pedidos.filter((p) => p.estado !== "CANCELADO");
  const viandasVendidas = activos.reduce(
    (acc, p) => acc + p.items.reduce((a, i) => a + i.cantidad, 0),
    0
  );
  const ingresos = activos.reduce((acc, p) => acc + p.total, 0);
  const pagosPendientes = activos.filter((p) => p.estadoPago !== "CONFIRMADO").length;
  const entregados = activos.filter((p) => p.estado === "ENTREGADO").length;

  const bajos = insumosBajos.filter((i) => i.stock <= i.stockMinimo);

  const porEstado = new Map<string, number>();
  for (const p of activos) porEstado.set(p.estado, (porEstado.get(p.estado) ?? 0) + 1);

  return (
    <>
      <h1 className="text-2xl font-extrabold capitalize text-brie-violet-deep">
        Panel del día · {fmtFecha(fecha)}
      </h1>

      {/* Tarjetas resumen */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Pedidos de hoy</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-violet-deep">{activos.length}</p>
          <p className="text-sm text-foreground/60">{viandasVendidas} viandas en total</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Ingresos del día</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-orange">{fmtPrecio(ingresos)}</p>
          <p className="text-sm text-foreground/60">{pagosPendientes} pagos sin confirmar</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Entregas</p>
          <p className="mt-1 text-3xl font-extrabold text-brie-violet-deep">
            {entregados}/{activos.length}
          </p>
          <p className="text-sm text-foreground/60">pedidos entregados</p>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase text-brie-violet">Alertas de stock</p>
          <p className={`mt-1 text-3xl font-extrabold ${bajos.length ? "text-red-600" : "text-green-600"}`}>
            {bajos.length}
          </p>
          <p className="text-sm text-foreground/60">insumos bajo el mínimo</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Producción del día */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-brie-violet-deep">Producción del día</h2>
            <Link href="/admin/menu" className="text-sm font-bold text-brie-orange hover:underline">
              Editar menú →
            </Link>
          </div>
          {menus.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/60">
              No hay menú publicado para hoy.{" "}
              <Link href="/admin/menu" className="font-bold text-brie-violet hover:underline">
                Publicalo acá
              </Link>
              .
            </p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
                  <th className="py-2">Vianda</th>
                  <th className="py-2 text-center">Pedidas</th>
                  <th className="py-2 text-center">Cupo</th>
                  <th className="py-2 text-center">Cocción</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => {
                  const pedidas = m.items.reduce((a, i) => a + i.cantidad, 0);
                  return (
                    <tr key={m.id} className="border-b border-brie-lavender-light/60">
                      <td className="py-2 font-semibold">{m.vianda.nombre}</td>
                      <td className="py-2 text-center font-extrabold text-brie-violet-deep">{pedidas}</td>
                      <td className="py-2 text-center text-foreground/60">{m.cupo}</td>
                      <td className="py-2 text-center">
                        {m.producido ? (
                          <span className="badge bg-green-100 text-green-800">Lista</span>
                        ) : (
                          <span className="badge bg-amber-100 text-amber-800">En curso</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Estado de pedidos */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-brie-violet-deep">Pedidos por estado</h2>
            <Link href="/admin/pedidos" className="text-sm font-bold text-brie-orange hover:underline">
              Ver todos →
            </Link>
          </div>
          {activos.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/60">Todavía no entraron pedidos hoy.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {[...porEstado.entries()].map(([estado, cant]) => (
                <div key={estado} className="flex items-center justify-between">
                  <span className={`badge ${ESTADO_COLOR[estado]}`}>{ESTADO_LABEL[estado]}</span>
                  <span className="font-extrabold text-brie-violet-deep">{cant}</span>
                </div>
              ))}
            </div>
          )}

          {/* Alertas */}
          {(bajos.length > 0 || insumosPorVencer.length > 0) && (
            <div className="mt-5 border-t border-brie-lavender-light pt-3">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-red-600">
                <IconAlert className="h-4 w-4" /> Alertas
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {bajos.map((i) => (
                  <li key={`b${i.id}`} className="flex items-center gap-1.5">
                    <IconTrendingDown className="h-4 w-4 shrink-0 text-red-500" />
                    <span>
                      <span className="font-semibold">{i.nombre}</span>: quedan{" "}
                      {fmtUnidad(i.stock, i.unidad)} (mínimo {fmtCantidad(i.stockMinimo)})
                    </span>
                  </li>
                ))}
                {insumosPorVencer.map((i) => (
                  <li key={`v${i.id}`} className="flex items-center gap-1.5">
                    <IconHourglass className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      <span className="font-semibold">{i.nombre}</span> vence el{" "}
                      {i.vencimiento?.toLocaleDateString("es-AR")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
