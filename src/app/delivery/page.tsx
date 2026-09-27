import Navbar from "@/components/Navbar";
import { requireRol } from "@/lib/auth";
import { db } from "@/lib/db";
import { hoy, fmtFecha } from "@/lib/fechas";
import {
  avisarLlegando,
  marcarEnCamino,
  marcarEntregado,
  marcarNoEntregado,
} from "@/lib/actions/operaciones";
import CompartirUbicacion from "@/components/CompartirUbicacion";
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  PAGO_COLOR,
  PAGO_LABEL,
  ZONA_LABEL,
  fmtPrecio,
} from "@/lib/constants";
import {
  IconBike,
  IconMapPin,
  IconPhone,
  IconNote,
  IconBanknote,
  IconCheck,
  IconX,
  IconNavigation,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const session = await requireRol("DELIVERY", "ADMIN");
  const fecha = hoy();

  const cadete =
    session.rol === "DELIVERY" ? await db.user.findUnique({ where: { id: session.id } }) : null;

  // Hoja de ruta: pedidos listos/en camino de la zona del cadete
  // (o los asignados directamente a él). Un admin ve todas las zonas.
  const pedidos = await db.pedido.findMany({
    where: {
      fechaEntrega: fecha,
      estado: { in: ["PREPARADO", "EN_CAMINO", "ENTREGADO", "NO_ENTREGADO"] },
      ...(cadete?.zona
        ? { OR: [{ zona: cadete.zona }, { cadeteId: session.id }] }
        : {}),
    },
    include: {
      cliente: true,
      items: { include: { menuDia: { include: { vianda: true } } } },
    },
    orderBy: [{ estado: "asc" }, { direccion: "asc" }],
  });

  const pendientes = pedidos.filter((p) => ["PREPARADO", "EN_CAMINO"].includes(p.estado));
  const terminados = pedidos.filter((p) => ["ENTREGADO", "NO_ENTREGADO"].includes(p.estado));

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-brie-violet-deep">
          <IconBike className="h-7 w-7" /> Hoja de ruta
        </h1>
        <p className="mt-1 capitalize text-foreground/70">
          {fmtFecha(fecha)}
          {cadete?.zona ? ` · ${ZONA_LABEL[cadete.zona]}` : " · Todas las zonas"}
        </p>

        <CompartirUbicacion />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="card py-3 text-center">
            <p className="text-2xl font-extrabold text-brie-orange">{pendientes.length}</p>
            <p className="text-xs font-bold uppercase text-brie-violet">por entregar</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-2xl font-extrabold text-green-600">
              {terminados.filter((p) => p.estado === "ENTREGADO").length}
            </p>
            <p className="text-xs font-bold uppercase text-brie-violet">entregados</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {pendientes.length === 0 && (
            <div className="card text-center text-foreground/70">
              No hay pedidos listos para repartir en este momento. Cocina los marca “preparados”
              cuando están listos.
            </div>
          )}
          {pendientes.map((p) => (
            <div key={p.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-brie-violet-deep">#{p.id}</span>
                  <span className={`badge ${ESTADO_COLOR[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                  <span className={`badge ${PAGO_COLOR[p.estadoPago]}`}>{PAGO_LABEL[p.estadoPago]}</span>
                </div>
                <span className="font-extrabold text-brie-orange">{fmtPrecio(p.total)}</span>
              </div>

              <div className="mt-2 text-sm">
                <p className="flex items-center gap-1.5 text-base font-extrabold text-brie-violet-deep">
                  <IconMapPin className="h-4.5 w-4.5 shrink-0" />
                  {p.direccion}
                  {p.piso ? `, ${p.piso}` : ""}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-foreground/70">
                  <span>{p.cliente.nombre}</span>
                  {p.cliente.telefono && (
                    <span className="inline-flex items-center gap-1">
                      <IconPhone className="h-3.5 w-3.5" /> {p.cliente.telefono}
                    </span>
                  )}
                  <span>{ZONA_LABEL[p.zona]}</span>
                </p>
                <p className="mt-1">
                  {p.items.map((i) => `${i.cantidad}× ${i.menuDia.vianda.nombre}`).join(" · ")}
                </p>
                {p.observaciones && (
                  <p className="mt-1 flex items-center gap-1.5 font-semibold text-brie-orange-dark">
                    <IconNote className="h-4 w-4 shrink-0" /> {p.observaciones}
                  </p>
                )}
                {p.estadoPago !== "CONFIRMADO" && p.metodoPago === "EFECTIVO" && (
                  <p className="mt-1 flex items-center gap-1.5 font-bold text-red-600">
                    <IconBanknote className="h-4 w-4 shrink-0" /> Cobrar en efectivo
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {p.estado === "PREPARADO" && (
                  <form action={marcarEnCamino}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn-orange text-xs">
                      <IconBike className="h-4 w-4" /> Salir en camino
                    </button>
                  </form>
                )}
                {p.estado === "EN_CAMINO" && (
                  <>
                    <form action={avisarLlegando}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn text-xs text-brie-violet hover:bg-brie-lavender-light">
                        <IconNavigation className="h-3.5 w-3.5" /> Avisar que llego
                      </button>
                    </form>
                    <form action={marcarEntregado}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn text-xs bg-green-600 text-white hover:bg-green-700">
                        <IconCheck className="h-3.5 w-3.5" /> Entregado
                      </button>
                    </form>
                    <form action={marcarNoEntregado}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn text-xs text-red-600 hover:bg-red-50">
                        <IconX className="h-3.5 w-3.5" /> No se pudo entregar
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {terminados.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-extrabold text-brie-violet-dark">Cerrados de hoy</h2>
            <div className="mt-3 space-y-2">
              {terminados.map((p) => (
                <div key={p.id} className="card flex items-center justify-between py-3 opacity-75">
                  <span className="text-sm">
                    <b>#{p.id}</b> · {p.direccion}
                    {p.piso ? `, ${p.piso}` : ""}
                  </span>
                  <span className={`badge ${ESTADO_COLOR[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
