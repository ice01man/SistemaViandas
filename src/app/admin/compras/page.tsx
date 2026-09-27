import { db } from "@/lib/db";
import { fmtUnidad } from "@/lib/constants";
import { diasHabilesProximos, fmtFechaCorta } from "@/lib/fechas";
import PrintButton from "@/components/PrintButton";
import { IconLightbulb } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminComprasPage() {
  // Consolida los ingredientes necesarios para cubrir el cupo publicado
  // de los próximos 5 días hábiles (la semana de venta).
  const fechas = diasHabilesProximos(5);

  const menus = await db.menuDia.findMany({
    where: { fecha: { in: fechas } },
    include: { vianda: { include: { receta: { include: { ingrediente: true } } } } },
  });

  type Fila = {
    nombre: string;
    unidad: string;
    necesario: number;
    stock: number;
    faltante: number;
  };
  const porIngrediente = new Map<number, Fila>();

  for (const m of menus) {
    for (const r of m.vianda.receta) {
      const fila =
        porIngrediente.get(r.ingredienteId) ??
        ({
          nombre: r.ingrediente.nombre,
          unidad: r.ingrediente.unidad,
          necesario: 0,
          stock: r.ingrediente.stock,
          faltante: 0,
        } as Fila);
      fila.necesario += r.cantidad * m.cupo;
      porIngrediente.set(r.ingredienteId, fila);
    }
  }

  const filas = [...porIngrediente.values()]
    .map((f) => ({ ...f, faltante: Math.max(0, f.necesario - f.stock) }))
    .sort((a, b) => b.faltante - a.faltante || a.nombre.localeCompare(b.nombre));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brie-violet-deep">Lista de compras</h1>
          <p className="mt-1 text-foreground/70">
            Ingredientes consolidados para el cupo publicado del {fmtFechaCorta(fechas[0])} al{" "}
            {fmtFechaCorta(fechas[fechas.length - 1])}.
          </p>
        </div>
        <PrintButton />
      </div>

      {filas.length === 0 ? (
        <div className="card mt-6 text-center text-foreground/70">
          No hay menú publicado para los próximos días, así que no hay nada que comprar todavía.
        </div>
      ) : (
        <>
          {/* Mobile/tablet: tarjetas */}
          <div className="mt-6 space-y-3 md:hidden">
            {filas.map((f) => (
              <div key={f.nombre} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-brie-violet-deep">{f.nombre}</h3>
                  {f.faltante > 0 ? (
                    <span className="font-extrabold text-brie-orange">
                      Comprar {fmtUnidad(f.faltante, f.unidad)}
                    </span>
                  ) : (
                    <span className="badge bg-green-100 text-green-800">Cubierto</span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase text-brie-violet">Necesario (semana)</p>
                    <p>{fmtUnidad(f.necesario, f.unidad)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-brie-violet">En stock</p>
                    <p className="text-foreground/70">{fmtUnidad(f.stock, f.unidad)}</p>
                  </div>
                </div>
              </div>
            ))}
            <p className="flex items-center gap-1.5 px-1 text-xs text-foreground/60">
              <IconLightbulb className="h-4 w-4 shrink-0" /> Recordá que algunos insumos requieren
              48 hs de entrega del proveedor.
            </p>
          </div>

          {/* Desktop: tabla */}
          <div className="card mt-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
                  <th className="py-2">Ingrediente</th>
                  <th className="py-2 text-center">Necesario (semana)</th>
                  <th className="py-2 text-center">En stock</th>
                  <th className="py-2 text-center">A comprar</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.nombre} className="border-b border-brie-lavender-light/60">
                    <td className="py-2 font-semibold">{f.nombre}</td>
                    <td className="py-2 text-center">{fmtUnidad(f.necesario, f.unidad)}</td>
                    <td className="py-2 text-center text-foreground/60">
                      {fmtUnidad(f.stock, f.unidad)}
                    </td>
                    <td className="py-2 text-center">
                      {f.faltante > 0 ? (
                        <span className="font-extrabold text-brie-orange">
                          {fmtUnidad(f.faltante, f.unidad)}
                        </span>
                      ) : (
                        <span className="badge bg-green-100 text-green-800">Cubierto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground/60">
              <IconLightbulb className="h-4 w-4 shrink-0" /> Recordá que algunos insumos requieren
              48 hs de entrega del proveedor.
            </p>
          </div>
        </>
      )}
    </>
  );
}
