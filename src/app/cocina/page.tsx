import Navbar from "@/components/Navbar";
import { requireRol } from "@/lib/auth";
import { db } from "@/lib/db";
import { hoy, fmtFecha } from "@/lib/fechas";
import { confirmarCoccion, iniciarPreparacion, marcarPreparado } from "@/lib/actions/operaciones";
import { ESTADO_COLOR, ESTADO_LABEL, ZONA_LABEL, fmtUnidad } from "@/lib/constants";
import {
  CategoriaIcon,
  IconChefHat,
  IconCircleCheck,
  IconAlert,
  IconPlay,
  IconCheck,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  await requireRol("COCINA", "ADMIN");
  const fecha = hoy();

  const [menus, pedidos] = await Promise.all([
    db.menuDia.findMany({
      where: { fecha },
      include: {
        vianda: { include: { receta: { include: { ingrediente: true } } } },
        items: { where: { pedido: { estado: { not: "CANCELADO" } } }, select: { cantidad: true } },
      },
      orderBy: { vianda: { categoria: "asc" } },
    }),
    db.pedido.findMany({
      where: { fechaEntrega: fecha, estado: { in: ["CONFIRMADO", "EN_PREPARACION", "PREPARADO"] } },
      include: {
        cliente: true,
        items: { include: { menuDia: { include: { vianda: true } } } },
      },
      orderBy: [{ zona: "asc" }, { id: "asc" }],
    }),
  ]);

  const confirmados = pedidos.filter((p) => p.estado === "CONFIRMADO").length;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-brie-violet-deep">
          <IconChefHat className="h-7 w-7" /> Panel de cocina
        </h1>
        <p className="mt-1 capitalize text-foreground/70">{fmtFecha(fecha)}</p>

        {/* Producción del día */}
        <h2 className="mt-6 text-lg font-extrabold text-brie-violet-dark">Producción del día</h2>
        <p className="text-sm text-foreground/60">
          Cantidad a cocinar = pedidos confirmados hasta el corte (la comanda real ajusta el
          estimado). Al confirmar la cocción se descuentan los insumos del stock.
        </p>

        {menus.length === 0 ? (
          <div className="card mt-4 text-center text-foreground/70">
            No hay menú publicado para hoy.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {menus.map((m) => {
              const cantidad = m.items.reduce((a, i) => a + i.cantidad, 0);
              return (
                <div key={m.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brie-lavender-light text-brie-violet">
                        <CategoriaIcon categoria={m.vianda.categoria} className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="font-extrabold text-brie-violet-deep">{m.vianda.nombre}</h3>
                        <p className="text-xs text-foreground/60">
                          Estimado (cupo): {m.cupo} · Pedidas: <b>{cantidad}</b>
                        </p>
                      </div>
                    </div>
                    <span className="rounded-2xl bg-brie-lavender-light px-4 py-2 text-center">
                      <span className="block text-2xl font-extrabold text-brie-violet-deep">{cantidad}</span>
                      <span className="text-[10px] font-bold uppercase text-brie-violet">a cocinar</span>
                    </span>
                  </div>

                  {/* Receta escalada */}
                  <div className="mt-3 rounded-xl bg-brie-lavender-soft p-3">
                    <h4 className="text-xs font-extrabold uppercase text-brie-violet">
                      Receta · ingredientes para {cantidad || "—"} porciones
                    </h4>
                    {m.vianda.receta.length === 0 ? (
                      <p className="mt-1 text-xs text-foreground/60">Sin receta cargada.</p>
                    ) : (
                      <ul className="mt-1 grid grid-cols-2 gap-x-3 text-sm">
                        {m.vianda.receta.map((r) => (
                          <li key={r.id} className="flex justify-between">
                            <span>{r.ingrediente.nombre}</span>
                            <span className="font-bold">
                              {fmtUnidad(r.cantidad * (cantidad || 1), r.ingrediente.unidad)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end">
                    {m.producido ? (
                      <span className="badge gap-1.5 bg-green-100 text-green-800">
                        <IconCircleCheck className="h-3.5 w-3.5" /> Cocción confirmada
                      </span>
                    ) : (
                      <form action={confirmarCoccion}>
                        <input type="hidden" name="menuDiaId" value={m.id} />
                        <button className="btn-orange text-xs" disabled={cantidad === 0}>
                          <IconCheck className="h-4 w-4" /> Confirmar cocción (descuenta insumos)
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comanda de pedidos */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-brie-violet-dark">
            Comanda del día ({pedidos.length} pedidos)
          </h2>
          {confirmados > 0 && (
            <form action={iniciarPreparacion}>
              <input type="hidden" name="fecha" value={fecha} />
              <button className="btn-primary text-xs">
                <IconPlay className="h-3.5 w-3.5" /> Iniciar preparación ({confirmados} confirmados)
              </button>
            </form>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {pedidos.length === 0 && (
            <div className="card text-center text-foreground/70">No hay pedidos pendientes hoy.</div>
          )}
          {pedidos.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-brie-violet-deep">#{p.id}</span>
                  <span className="font-semibold">{p.cliente.nombre}</span>
                  <span className={`badge ${ESTADO_COLOR[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                  <span className="badge bg-brie-lavender-light text-brie-violet-dark">
                    {ZONA_LABEL[p.zona]}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {p.items.map((i) => `${i.cantidad}× ${i.menuDia.vianda.nombre}`).join(" · ")}
                </p>
                {(p.observaciones || p.cliente.restricciones) && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brie-orange-dark">
                    <IconAlert className="h-4 w-4 shrink-0" />
                    {p.observaciones ?? p.cliente.restricciones}
                  </p>
                )}
              </div>
              {p.estado !== "PREPARADO" ? (
                <form action={marcarPreparado}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn-primary text-xs">
                    <IconCheck className="h-3.5 w-3.5" /> Marcar preparado
                  </button>
                </form>
              ) : (
                <span className="badge bg-violet-100 text-violet-800">Listo para reparto</span>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
