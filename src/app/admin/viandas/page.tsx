import { db } from "@/lib/db";
import {
  guardarVianda,
  eliminarVianda,
  guardarRecetaItem,
  eliminarRecetaItem,
} from "@/lib/actions/admin";
import { CATEGORIA_LABEL, CATEGORIAS, fmtUnidad, UNIDAD_LABEL } from "@/lib/constants";
import { CategoriaIcon, IconPlus, IconChefHat } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminViandasPage() {
  const [viandas, ingredientes] = await Promise.all([
    db.vianda.findMany({
      include: { receta: { include: { ingrediente: true } } },
      orderBy: [{ activa: "desc" }, { categoria: "asc" }, { nombre: "asc" }],
    }),
    db.ingrediente.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-extrabold text-brie-violet-deep">Viandas y recetas</h1>
      <p className="mt-1 text-foreground/70">
        ABM del catálogo de viandas con su receta (ingredientes por porción).
      </p>

      {/* Alta de vianda */}
      <div className="card mt-6 bg-brie-lavender-soft">
        <h3 className="flex items-center gap-1.5 font-extrabold text-brie-violet-deep">
          <IconPlus className="h-4 w-4" /> Nueva vianda
        </h3>
        <form action={guardarVianda} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="label">Nombre</label>
            <input className="input" name="nombre" required placeholder="Ej.: Milanesa con puré" />
          </div>
          <div className="min-w-64 flex-[2]">
            <label className="label">Descripción</label>
            <input className="input" name="descripcion" placeholder="Descripción para el cliente" />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input w-40" name="categoria">
              {Object.values(CATEGORIAS).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="activa" value="on" />
          <button className="btn-orange">Crear</button>
        </form>
      </div>

      {/* Listado */}
      <div className="mt-6 space-y-4">
        {viandas.map((v) => (
          <div key={v.id} className={`card ${!v.activa ? "opacity-60" : ""}`}>
            <form action={guardarVianda} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={v.id} />
              <span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brie-lavender-light text-brie-violet">
                <CategoriaIcon categoria={v.categoria} className="h-6 w-6" />
              </span>
              <div className="min-w-52 flex-1">
                <label className="label">Nombre</label>
                <input className="input" name="nombre" defaultValue={v.nombre} required />
              </div>
              <div className="min-w-64 flex-[2]">
                <label className="label">Descripción</label>
                <input className="input" name="descripcion" defaultValue={v.descripcion} />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input w-36" name="categoria" defaultValue={v.categoria}>
                  {Object.values(CATEGORIAS).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm font-bold text-brie-violet-dark">
                <input type="checkbox" name="activa" defaultChecked={v.activa} /> Activa
              </label>
              <button className="btn-primary text-xs">Guardar</button>
            </form>

            {/* Receta */}
            <div className="mt-4 rounded-xl bg-brie-lavender-soft p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-brie-violet-dark">
                <IconChefHat className="h-4 w-4" /> Receta (por porción)
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.receta.map((r) => (
                  <form
                    key={r.id}
                    action={eliminarRecetaItem}
                    className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-semibold ring-1 ring-brie-lavender"
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <span>
                      {r.ingrediente.nombre}: {fmtUnidad(r.cantidad, r.ingrediente.unidad)}
                    </span>
                    <button className="ml-1 text-red-500 hover:text-red-700" title="Quitar ingrediente">
                      ×
                    </button>
                  </form>
                ))}
                {v.receta.length === 0 && (
                  <span className="text-xs text-foreground/60">Sin ingredientes cargados.</span>
                )}
              </div>
              <form action={guardarRecetaItem} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="viandaId" value={v.id} />
                <div>
                  <label className="label">Ingrediente</label>
                  <select className="input w-48" name="ingredienteId">
                    {ingredientes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({UNIDAD_LABEL[i.unidad] ?? i.unidad})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Cantidad</label>
                  <input className="input w-24" type="number" step="0.01" min="0.01" name="cantidad" required />
                </div>
                <button className="btn-primary text-xs">Agregar</button>
              </form>
            </div>

            <form action={eliminarVianda} className="mt-3 text-right">
              <input type="hidden" name="id" value={v.id} />
              <button className="text-xs font-semibold text-red-500 hover:underline">
                Eliminar vianda (si tiene historial, se desactiva)
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
