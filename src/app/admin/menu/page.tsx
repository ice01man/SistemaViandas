import Link from "next/link";
import { db } from "@/lib/db";
import { diasHabilesProximos, fmtFecha, hoy } from "@/lib/fechas";
import { publicarMenuDia, quitarMenuDia } from "@/lib/actions/admin";
import { CATEGORIA_LABEL, fmtPrecio } from "@/lib/constants";
import { CategoriaIcon, IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage(props: PageProps<"/admin/menu">) {
  const searchParams = await props.searchParams;
  const fechas = diasHabilesProximos(10);
  const fechaParam = typeof searchParams.fecha === "string" ? searchParams.fecha : undefined;
  const fecha = fechaParam && fechas.includes(fechaParam) ? fechaParam : fechas[0];

  const [menus, viandas] = await Promise.all([
    db.menuDia.findMany({
      where: { fecha },
      include: {
        vianda: true,
        items: { where: { pedido: { estado: { not: "CANCELADO" } } }, select: { cantidad: true } },
      },
      orderBy: { vianda: { categoria: "asc" } },
    }),
    db.vianda.findMany({ where: { activa: true }, orderBy: [{ categoria: "asc" }, { nombre: "asc" }] }),
  ]);

  const publicadas = new Set(menus.map((m) => m.viandaId));
  const disponiblesParaAgregar = viandas.filter((v) => !publicadas.has(v.id));

  return (
    <>
      <h1 className="text-2xl font-extrabold text-brie-violet-deep">Menú semanal</h1>
      <p className="mt-1 text-foreground/70">
        Publicá las opciones de cada día con su cupo (estimado a producir) y precios por grupo.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {fechas.map((f) => (
          <Link
            key={f}
            href={`/admin/menu?fecha=${f}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              f === fecha
                ? "bg-brie-solid text-white"
                : "bg-surface text-brie-violet-dark ring-1 ring-brie-lavender"
            }`}
          >
            {f === hoy() ? "Hoy" : f.slice(8) + "/" + f.slice(5, 7)}
          </Link>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-extrabold capitalize text-brie-violet-dark">{fmtFecha(fecha)}</h2>

      {/* Viandas publicadas */}
      <div className="mt-4 space-y-3">
        {menus.length === 0 && (
          <div className="card text-center text-foreground/70">
            No hay viandas publicadas para este día todavía.
          </div>
        )}
        {menus.map((m) => {
          const vendidas = m.items.reduce((a, i) => a + i.cantidad, 0);
          return (
            <div key={m.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brie-lavender-light text-brie-violet">
                    <CategoriaIcon categoria={m.vianda.categoria} className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-extrabold text-brie-violet-deep">{m.vianda.nombre}</p>
                    <p className="text-xs text-foreground/60">
                      Vendidas: {vendidas} / {m.cupo} · Individuo {fmtPrecio(m.precioIndividuo)} ·
                      Empresa {fmtPrecio(m.precioEmpresa)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <form action={publicarMenuDia} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="fecha" value={fecha} />
                    <input type="hidden" name="viandaId" value={m.viandaId} />
                    <div>
                      <label className="label">Cupo</label>
                      <input className="input w-20" type="number" name="cupo" min={vendidas || 1} defaultValue={m.cupo} />
                    </div>
                    <div>
                      <label className="label">$ Individuo</label>
                      <input className="input w-24" type="number" name="precioIndividuo" min={1} defaultValue={m.precioIndividuo} />
                    </div>
                    <div>
                      <label className="label">$ Empresa</label>
                      <input className="input w-24" type="number" name="precioEmpresa" min={1} defaultValue={m.precioEmpresa} />
                    </div>
                    <button className="btn-primary text-xs">Actualizar</button>
                  </form>
                  {vendidas === 0 && (
                    <form action={quitarMenuDia}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="btn text-xs text-red-600 hover:bg-red-50">Quitar</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agregar vianda al día */}
      {disponiblesParaAgregar.length > 0 && (
        <div className="card mt-6 bg-brie-lavender-soft">
          <h3 className="flex items-center gap-1.5 font-extrabold text-brie-violet-deep">
            <IconPlus className="h-4 w-4" /> Publicar vianda en este día
          </h3>
          <form action={publicarMenuDia} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="fecha" value={fecha} />
            <div>
              <label className="label">Vianda</label>
              <select className="input w-64" name="viandaId">
                {disponiblesParaAgregar.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} ({CATEGORIA_LABEL[v.categoria]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cupo</label>
              <input className="input w-20" type="number" name="cupo" min={1} defaultValue={50} />
            </div>
            <div>
              <label className="label">$ Individuo</label>
              <input className="input w-24" type="number" name="precioIndividuo" min={1} defaultValue={6500} />
            </div>
            <div>
              <label className="label">$ Empresa</label>
              <input className="input w-24" type="number" name="precioEmpresa" min={1} defaultValue={5800} />
            </div>
            <button className="btn-orange">Publicar</button>
          </form>
          <p className="mt-2 text-xs text-foreground/60">
            ¿No está la vianda? Creala primero en{" "}
            <Link href="/admin/viandas" className="font-bold text-brie-violet hover:underline">
              Viandas y recetas
            </Link>
            .
          </p>
        </div>
      )}
    </>
  );
}
