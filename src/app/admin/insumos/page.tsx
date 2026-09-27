import { db } from "@/lib/db";
import {
  guardarIngrediente,
  ingresarMercaderia,
  eliminarIngrediente,
} from "@/lib/actions/admin";
import { UNIDADES, UNIDAD_NOMBRE, UNIDAD_LABEL, fmtUnidad } from "@/lib/constants";
import { IconPlus } from "@/components/icons";
import FiltroBusqueda from "@/components/FiltroBusqueda";
import FiltroSelect from "@/components/FiltroSelect";

export const dynamic = "force-dynamic";

export default async function AdminInsumosPage(props: PageProps<"/admin/insumos">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const estadoFiltro = typeof searchParams.estado === "string" ? searchParams.estado : "";

  const todos = await db.ingrediente.findMany({
    include: { _count: { select: { recetas: true } } },
    orderBy: { nombre: "asc" },
  });

  const proximoVencimiento = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const estadoDe = (i: (typeof todos)[number]) =>
    i.stock <= i.stockMinimo
      ? "REPONER"
      : i.vencimiento && i.vencimiento <= proximoVencimiento
        ? "POR_VENCER"
        : "OK";

  const ingredientes = todos.filter(
    (i) =>
      (!q || i.nombre.toLowerCase().includes(q)) &&
      (!estadoFiltro || estadoDe(i) === estadoFiltro)
  );

  const badgeEstado = (estado: string) =>
    estado === "REPONER" ? (
      <span className="badge bg-red-100 text-red-700">Reponer</span>
    ) : estado === "POR_VENCER" ? (
      <span className="badge bg-amber-100 text-amber-800">Por vencer</span>
    ) : (
      <span className="badge bg-green-100 text-green-800">OK</span>
    );

  return (
    <>
      <h1 className="text-2xl font-extrabold text-brie-violet-deep">Stock de insumos</h1>
      <p className="mt-1 text-foreground/70">
        El stock se abastece con el ingreso de mercadería y se descuenta cuando Cocina confirma la
        cocción del día. Controla mínimos y vencimientos.
      </p>

      {/* Alta de insumo */}
      <div className="card mt-6 bg-brie-lavender-soft">
        <h3 className="flex items-center gap-1.5 font-extrabold text-brie-violet-deep">
          <IconPlus className="h-4 w-4" /> Nuevo insumo
        </h3>
        <form action={guardarIngrediente} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="label">Nombre</label>
            <input className="input" name="nombre" required />
          </div>
          <div>
            <label className="label">Unidad</label>
            <select className="input w-40" name="unidad">
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {UNIDAD_NOMBRE[u]} ({UNIDAD_LABEL[u]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Stock inicial</label>
            <input className="input w-28" type="number" step="0.01" min="0" name="stock" defaultValue={0} />
          </div>
          <div>
            <label className="label">Stock mínimo</label>
            <input className="input w-28" type="number" step="0.01" min="0" name="stockMinimo" defaultValue={0} />
          </div>
          <div>
            <label className="label">Vencimiento</label>
            <input className="input w-40" type="date" name="vencimiento" />
          </div>
          <button className="btn-orange">Crear</button>
        </form>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FiltroBusqueda placeholder="Buscar insumo por nombre..." className="min-w-64 flex-1" />
        <FiltroSelect
          param="estado"
          className="w-40"
          opciones={[
            { value: "", label: "Todos los estados" },
            { value: "REPONER", label: "Reponer" },
            { value: "POR_VENCER", label: "Por vencer" },
            { value: "OK", label: "OK" },
          ]}
        />
        {(q || estadoFiltro) && (
          <span className="text-sm text-foreground/60">
            {ingredientes.length} resultado{ingredientes.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Mobile/tablet: tarjetas */}
      <div className="mt-3 space-y-3 md:hidden">
        {ingredientes.map((i) => (
          <div key={i.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-brie-violet-deep">{i.nombre}</h3>
              {badgeEstado(estadoDe(i))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-brie-violet">Stock</p>
                <p className="font-extrabold text-brie-violet-deep">{fmtUnidad(i.stock, i.unidad)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-brie-violet">Mínimo</p>
                <p className="text-foreground/70">{fmtUnidad(i.stockMinimo, i.unidad)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-brie-violet">Vence</p>
                <p className="text-foreground/70">
                  {i.vencimiento ? i.vencimiento.toLocaleDateString("es-AR") : "—"}
                </p>
              </div>
            </div>
            <form
              action={ingresarMercaderia}
              className="mt-3 flex flex-wrap items-center gap-2 border-t border-brie-lavender-light pt-3"
            >
              <input type="hidden" name="id" value={i.id} />
              <input
                className="input w-24 py-1.5"
                type="number"
                step="0.01"
                min="0.01"
                name="cantidad"
                placeholder="Cant."
                required
              />
              <input className="input min-w-0 flex-1 py-1.5" type="date" name="vencimiento" />
              <button className="btn-primary px-3 py-1.5 text-xs">Ingresar</button>
            </form>
            {i._count.recetas === 0 && (
              <form action={eliminarIngrediente} className="mt-2 text-right">
                <input type="hidden" name="id" value={i.id} />
                <button className="text-xs text-red-500 hover:underline">Eliminar</button>
              </form>
            )}
          </div>
        ))}
        {ingredientes.length === 0 && (
          <p className="card p-4 text-center text-sm text-foreground/60">
            Sin insumos que coincidan con el filtro.
          </p>
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="card mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
              <th className="py-2">Insumo</th>
              <th className="py-2 text-center">Stock</th>
              <th className="py-2 text-center">Mínimo</th>
              <th className="py-2 text-center">Vencimiento</th>
              <th className="py-2 text-center">Estado</th>
              <th className="py-2">Ingreso de mercadería</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((i) => (
              <tr key={i.id} className="border-b border-brie-lavender-light/60">
                <td className="py-2 font-semibold">{i.nombre}</td>
                <td className="py-2 text-center font-extrabold text-brie-violet-deep">
                  {fmtUnidad(i.stock, i.unidad)}
                </td>
                <td className="py-2 text-center text-foreground/60">
                  {fmtUnidad(i.stockMinimo, i.unidad)}
                </td>
                <td className="py-2 text-center text-foreground/60">
                  {i.vencimiento ? i.vencimiento.toLocaleDateString("es-AR") : "—"}
                </td>
                <td className="py-2 text-center">{badgeEstado(estadoDe(i))}</td>
                <td className="py-2">
                  <form action={ingresarMercaderia} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <input
                      className="input w-24 py-1"
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="cantidad"
                      placeholder="Cant."
                      required
                    />
                    <input className="input w-36 py-1" type="date" name="vencimiento" />
                    <button className="btn-primary px-2 py-1 text-xs">Ingresar</button>
                  </form>
                </td>
                <td className="py-2 text-right">
                  {i._count.recetas === 0 && (
                    <form action={eliminarIngrediente}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ingredientes.length === 0 && (
          <p className="mt-3 text-center text-sm text-foreground/60">
            Sin insumos que coincidan con el filtro.
          </p>
        )}
      </div>
    </>
  );
}
