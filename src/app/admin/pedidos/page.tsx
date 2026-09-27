import Link from "next/link";
import { db } from "@/lib/db";
import { hoy, fmtFecha, diasHabilesProximos } from "@/lib/fechas";
import { asignarCadete, setEstadoPago, setEstadoPedido } from "@/lib/actions/admin";
import {
  ESTADOS_PEDIDO,
  ESTADOS_PAGO,
  ESTADO_LABEL,
  ESTADO_COLOR,
  PAGO_LABEL,
  PAGO_COLOR,
  ZONA_LABEL,
  ZONAS_LISTA,
  fmtPrecio,
} from "@/lib/constants";
import { IconMapPin, IconPhone, IconNote, IconReceipt } from "@/components/icons";
import FiltroBusqueda from "@/components/FiltroBusqueda";
import FiltroSelect from "@/components/FiltroSelect";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage(props: PageProps<"/admin/pedidos">) {
  const searchParams = await props.searchParams;
  const fecha = typeof searchParams.fecha === "string" ? searchParams.fecha : hoy();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const estadoFiltro = typeof searchParams.estado === "string" ? searchParams.estado : "";
  const zonaFiltro = typeof searchParams.zona === "string" ? searchParams.zona : "";

  const [todosPedidos, cadetes] = await Promise.all([
    db.pedido.findMany({
      where: { fechaEntrega: fecha },
      include: {
        cliente: true,
        cadete: true,
        items: { include: { menuDia: { include: { vianda: true } } } },
      },
      orderBy: [{ zona: "asc" }, { id: "asc" }],
    }),
    db.user.findMany({ where: { rol: "DELIVERY", activo: true } }),
  ]);

  const pedidos = todosPedidos.filter(
    (p) =>
      (!q ||
        String(p.id) === q.replace("#", "") ||
        p.cliente.nombre.toLowerCase().includes(q) ||
        p.direccion.toLowerCase().includes(q)) &&
      (!estadoFiltro || p.estado === estadoFiltro) &&
      (!zonaFiltro || p.zona === zonaFiltro)
  );

  const fechas = [hoy(), ...diasHabilesProximos(6).filter((f) => f !== hoy())];
  const otrosParams = new URLSearchParams();
  if (q) otrosParams.set("q", q);
  if (estadoFiltro) otrosParams.set("estado", estadoFiltro);
  if (zonaFiltro) otrosParams.set("zona", zonaFiltro);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brie-violet-deep">Pedidos</h1>
        <div className="flex flex-wrap items-center gap-2">
          {fechas.slice(0, 5).map((f) => (
            <Link
              key={f}
              href={`/admin/pedidos?fecha=${f}${otrosParams.size ? `&${otrosParams}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                f === fecha
                  ? "bg-brie-solid text-white"
                  : "bg-surface text-brie-violet-dark ring-1 ring-brie-lavender"
              }`}
            >
              {f === hoy() ? "Hoy" : f.slice(8) + "/" + f.slice(5, 7)}
            </Link>
          ))}
          {/* Cualquier otra fecha (también pasadas) */}
          <form className="flex items-center gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            {estadoFiltro && <input type="hidden" name="estado" value={estadoFiltro} />}
            {zonaFiltro && <input type="hidden" name="zona" value={zonaFiltro} />}
            <input className="input w-40 py-1.5 text-xs" type="date" name="fecha" defaultValue={fecha} />
            <button className="btn-outline px-3 py-1.5 text-xs">Ver</button>
          </form>
        </div>
      </div>
      <p className="mt-1 capitalize text-foreground/70">{fmtFecha(fecha)}</p>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FiltroBusqueda
          placeholder="Buscar por cliente, dirección o n° de pedido..."
          className="min-w-64 flex-1"
        />
        <FiltroSelect
          param="estado"
          className="w-44"
          opciones={[
            { value: "", label: "Todos los estados" },
            ...ESTADOS_PEDIDO.map((e) => ({ value: e, label: ESTADO_LABEL[e] })),
          ]}
        />
        <FiltroSelect
          param="zona"
          className="w-44"
          opciones={[
            { value: "", label: "Todas las zonas" },
            ...ZONAS_LISTA.map((z) => ({ value: z, label: ZONA_LABEL[z] })),
          ]}
        />
        {(q || estadoFiltro || zonaFiltro) && (
          <span className="text-sm text-foreground/60">
            {pedidos.length} de {todosPedidos.length}
          </span>
        )}
      </div>

      {pedidos.length === 0 ? (
        <div className="card mt-6 text-center text-foreground/70">
          {todosPedidos.length === 0
            ? "No hay pedidos para esta fecha."
            : "Ningún pedido coincide con el filtro."}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {pedidos.map((p) => (
            <div key={p.id} className={`card ${p.estado === "CANCELADO" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-brie-violet-deep">#{p.id}</span>
                    <span className="font-bold">{p.cliente.nombre}</span>
                    {p.cliente.grupo === "EMPRESA" && (
                      <span className="badge bg-brie-orange-light text-brie-orange-dark">Empresa</span>
                    )}
                    <span className={`badge ${ESTADO_COLOR[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                    <span className={`badge ${PAGO_COLOR[p.estadoPago]}`}>{PAGO_LABEL[p.estadoPago]}</span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground/70">
                    <span className="inline-flex items-center gap-1">
                      <IconMapPin className="h-3.5 w-3.5" />
                      {p.direccion}
                      {p.piso ? `, ${p.piso}` : ""} · {ZONA_LABEL[p.zona]}
                    </span>
                    {p.cliente.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <IconPhone className="h-3.5 w-3.5" /> {p.cliente.telefono}
                      </span>
                    )}
                  </p>
                  {p.observaciones && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-brie-violet-dark">
                      <IconNote className="h-3.5 w-3.5 shrink-0" /> {p.observaciones}
                    </p>
                  )}
                  <p className="mt-2 text-sm">
                    {p.items.map((i) => `${i.cantidad}× ${i.menuDia.vianda.nombre}`).join(" · ")}
                  </p>
                  {p.comprobante && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/60">
                      <IconReceipt className="h-3.5 w-3.5 shrink-0" /> Comprobante: {p.comprobante}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-brie-orange">{fmtPrecio(p.total)}</p>
                  <p className="text-xs text-foreground/60">{p.metodoPago ?? "—"}</p>
                </div>
              </div>

              {p.estado !== "CANCELADO" && (
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-brie-lavender-light pt-3">
                  <form action={setEstadoPedido} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <label className="label">Estado</label>
                      <select className="input w-44" name="estado" defaultValue={p.estado}>
                        {ESTADOS_PEDIDO.map((e) => (
                          <option key={e} value={e}>
                            {ESTADO_LABEL[e]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="btn-primary text-xs">Guardar</button>
                  </form>

                  <form action={setEstadoPago} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <label className="label">Pago</label>
                      <select className="input w-40" name="estadoPago" defaultValue={p.estadoPago}>
                        {ESTADOS_PAGO.map((e) => (
                          <option key={e} value={e}>
                            {PAGO_LABEL[e]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Comprobante</label>
                      <input
                        className="input w-40"
                        name="comprobante"
                        defaultValue={p.comprobante ?? ""}
                        placeholder="Referencia"
                      />
                    </div>
                    <button className="btn-primary text-xs">Guardar</button>
                  </form>

                  <form action={asignarCadete} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <label className="label">Cadete</label>
                      <select className="input w-44" name="cadeteId" defaultValue={p.cadeteId ?? 0}>
                        <option value={0}>Sin asignar</option>
                        {cadetes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.zona ? ZONA_LABEL[c.zona] : "todas las zonas"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="btn-primary text-xs">Asignar</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
