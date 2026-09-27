import Link from "next/link";
import Navbar from "@/components/Navbar";
import { menuConDisponibilidad } from "@/lib/menu";
import { getSession, getConfig } from "@/lib/auth";
import { diasHabilesProximos, fmtFecha, hoy } from "@/lib/fechas";
import { CATEGORIA_LABEL, fmtPrecio } from "@/lib/constants";
import { CategoriaIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function MenuPage(props: PageProps<"/menu">) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const fechas = diasHabilesProximos(5);
  const fechaParam = typeof searchParams.fecha === "string" ? searchParams.fecha : undefined;
  const fecha = fechaParam && fechas.includes(fechaParam) ? fechaParam : fechas[0];

  const [menus, horaCorte] = await Promise.all([
    menuConDisponibilidad(fecha),
    getConfig("horaCorte", "10:00"),
  ]);
  const esEmpresa = session?.grupo === "EMPRESA";

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold text-brie-violet-deep">Menú de la semana</h1>
        <p className="mt-1 text-foreground/70">
          Tomamos pedidos de lunes a viernes hasta las {horaCorte} hs · Envíos sin cargo
        </p>

        {/* Selector de fecha */}
        <div className="mt-6 flex flex-wrap gap-2">
          {fechas.map((f) => (
            <Link
              key={f}
              href={`/menu?fecha=${f}`}
              className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${
                f === fecha
                  ? "bg-brie-solid text-white"
                  : "bg-surface text-brie-violet-dark ring-1 ring-brie-lavender hover:bg-brie-lavender-light"
              }`}
            >
              {f === hoy() ? "Hoy" : fmtFecha(f).split(",")[0]} {f.slice(8)}
            </Link>
          ))}
        </div>

        <h2 className="mt-8 text-xl font-extrabold capitalize text-brie-violet-dark">{fmtFecha(fecha)}</h2>

        {menus.length === 0 ? (
          <div className="card mt-4 text-center text-foreground/70">
            Todavía no publicamos el menú de este día. ¡Volvé a mirar más tarde!
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {menus.map((m) => (
              <div key={m.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brie-lavender-light text-brie-violet">
                    <CategoriaIcon categoria={m.vianda.categoria} className="h-7 w-7" />
                  </span>
                  <span className="badge bg-brie-lavender-light text-brie-violet-dark">
                    {CATEGORIA_LABEL[m.vianda.categoria]}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-brie-violet-deep">{m.vianda.nombre}</h3>
                <p className="mt-1 flex-1 text-sm text-foreground/75">{m.vianda.descripcion}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-extrabold text-brie-orange">
                    {fmtPrecio(esEmpresa ? m.precioEmpresa : m.precioIndividuo)}
                  </span>
                  {m.disponibles > 0 ? (
                    <span className="badge bg-green-100 text-green-800">
                      {m.disponibles} disponibles
                    </span>
                  ) : (
                    <span className="badge bg-red-100 text-red-700">Agotado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href={session ? `/pedir?fecha=${fecha}` : "/registro"} className="btn-orange px-8 py-3 text-base">
            {session ? "Hacer mi pedido" : "Crear cuenta para pedir"}
          </Link>
        </div>
      </main>
    </>
  );
}
