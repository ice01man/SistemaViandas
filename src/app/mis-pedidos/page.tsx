import Navbar from "@/components/Navbar";
import { requireRol, getConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelarPedido, informarPago } from "@/lib/actions/pedidos";
import { fmtFecha, hoy, pasoElCorte } from "@/lib/fechas";
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  PAGO_COLOR,
  PAGO_LABEL,
  ZONA_LABEL,
  fmtPrecio,
} from "@/lib/constants";
import { IconCircleCheck, IconMapPin, IconNote, IconNavigation } from "@/components/icons";

/** La ubicación del cadete se considera vigente por 15 minutos. */
const UBICACION_VIGENTE_MS = 15 * 60 * 1000;

export const dynamic = "force-dynamic";

// Línea de tiempo del pedido: las "notificaciones" que ve el cliente
const TIMELINE = ["CONFIRMADO", "EN_PREPARACION", "PREPARADO", "EN_CAMINO", "ENTREGADO"];

export default async function MisPedidosPage(props: PageProps<"/mis-pedidos">) {
  const session = await requireRol("CLIENTE", "ADMIN");
  const searchParams = await props.searchParams;
  const nuevoId = typeof searchParams.nuevo === "string" ? Number(searchParams.nuevo) : null;

  const [pedidos, horaCorte] = await Promise.all([
    db.pedido.findMany({
      where: { clienteId: session.id },
      include: {
        items: { include: { menuDia: { include: { vianda: true } } } },
        cadete: {
          select: { nombre: true, ubicacionLat: true, ubicacionLng: true, ubicacionAt: true },
        },
      },
      orderBy: [{ fechaEntrega: "desc" }, { id: "desc" }],
      take: 30,
    }),
    getConfig("horaCorte", "10:00"),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold text-brie-violet-deep">Mis pedidos</h1>

        {nuevoId && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 font-semibold text-green-800">
            <IconCircleCheck className="h-5 w-5 shrink-0" /> ¡Pedido recibido! Te avisamos por acá
            cuando salga en camino.
          </div>
        )}

        {pedidos.length === 0 && (
          <div className="card mt-6 text-center text-foreground/70">
            Todavía no hiciste pedidos. ¡Mirá el menú del día!
          </div>
        )}

        <div className="mt-6 space-y-5">
          {pedidos.map((p) => {
            const cancelable =
              p.estado === "CONFIRMADO" && (p.fechaEntrega > hoy() || !pasoElCorte(horaCorte));
            const pasoActual = TIMELINE.indexOf(p.estado);
            const cadeteUbicado =
              p.estado === "EN_CAMINO" &&
              p.cadete?.ubicacionLat != null &&
              p.cadete.ubicacionLng != null &&
              p.cadete.ubicacionAt != null &&
              Date.now() - p.cadete.ubicacionAt.getTime() < UBICACION_VIGENTE_MS;
            return (
              <div key={p.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-bold text-brie-violet">Pedido #{p.id}</span>
                    <h3 className="text-lg font-extrabold capitalize text-brie-violet-deep">
                      {fmtFecha(p.fechaEntrega)}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`badge ${ESTADO_COLOR[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                    <span className={`badge ${PAGO_COLOR[p.estadoPago]}`}>{PAGO_LABEL[p.estadoPago]}</span>
                  </div>
                </div>

                {/* Timeline de estado (notificaciones del pedido) */}
                {pasoActual >= 0 && (
                  <div className="mt-4 flex items-center gap-1">
                    {TIMELINE.map((estado, i) => (
                      <div key={estado} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex w-full items-center">
                          <div
                            className={`h-1 flex-1 rounded ${i === 0 ? "invisible" : i <= pasoActual ? "bg-brie-violet" : "bg-brie-lavender-light"}`}
                          />
                          <div
                            className={`h-3 w-3 rounded-full ${i <= pasoActual ? "bg-brie-violet" : "bg-brie-lavender-light"}`}
                          />
                          <div
                            className={`h-1 flex-1 rounded ${i === TIMELINE.length - 1 ? "invisible" : i < pasoActual ? "bg-brie-violet" : "bg-brie-lavender-light"}`}
                          />
                        </div>
                        <span
                          className={`text-center text-[10px] font-bold ${i <= pasoActual ? "text-brie-violet-dark" : "text-foreground/40"}`}
                        >
                          {ESTADO_LABEL[estado]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {cadeteUbicado && (
                  <a
                    href={`https://www.google.com/maps?q=${p.cadete!.ubicacionLat},${p.cadete!.ubicacionLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 rounded-2xl bg-brie-lavender-light/60 px-4 py-2.5 text-sm font-bold text-brie-violet-dark hover:bg-brie-lavender-light"
                  >
                    <IconNavigation className="h-4.5 w-4.5 shrink-0" />
                    {p.cadete!.nombre.split(" ")[0]} está en camino: ver su ubicación en el mapa
                  </a>
                )}

                <div className="mt-4 space-y-1 border-t border-brie-lavender-light pt-3 text-sm">
                  {p.items.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span>
                        {i.cantidad} × {i.menuDia.vianda.nombre}
                      </span>
                      <span className="font-bold">{fmtPrecio(i.cantidad * i.precioUnit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-brie-lavender-light pt-2 text-base font-extrabold text-brie-violet-deep">
                    <span>Total</span>
                    <span>{fmtPrecio(p.total)}</span>
                  </div>
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground/60">
                  <span className="inline-flex items-center gap-1">
                    <IconMapPin className="h-3.5 w-3.5" />
                    {p.direccion}
                    {p.piso ? `, ${p.piso}` : ""} · {ZONA_LABEL[p.zona]}
                  </span>
                  {p.observaciones && (
                    <span className="inline-flex items-center gap-1">
                      <IconNote className="h-3.5 w-3.5" /> {p.observaciones}
                    </span>
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {p.estadoPago !== "CONFIRMADO" && p.estado !== "CANCELADO" && (
                    <form action={informarPago} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        className="input w-56"
                        name="comprobante"
                        placeholder="N° de comprobante / referencia"
                        defaultValue={p.comprobante ?? ""}
                      />
                      <button className="btn-primary text-xs">
                        {p.estadoPago === "INFORMADO" ? "Actualizar pago" : "Informar pago"}
                      </button>
                    </form>
                  )}
                  {cancelable && (
                    <form action={cancelarPedido}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn text-xs text-red-600 hover:bg-red-50">
                        Cancelar pedido
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
