import Link from "next/link";
import Navbar from "@/components/Navbar";
import { requireRol, getConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuConDisponibilidad } from "@/lib/menu";
import { fechasDisponibles, fmtFecha, hoy } from "@/lib/fechas";
import Carrito from "./Carrito";

export const dynamic = "force-dynamic";

export default async function PedirPage(props: PageProps<"/pedir">) {
  const session = await requireRol("CLIENTE", "ADMIN");
  const searchParams = await props.searchParams;

  const horaCorte = await getConfig("horaCorte", "10:00");
  const fechas = fechasDisponibles(horaCorte);
  const fechaParam = typeof searchParams.fecha === "string" ? searchParams.fecha : undefined;
  const fecha = fechaParam && fechas.includes(fechaParam) ? fechaParam : fechas[0];

  const [menus, usuario] = await Promise.all([
    menuConDisponibilidad(fecha),
    db.user.findUnique({ where: { id: session.id } }),
  ]);

  const hoyDisponible = fechas.includes(hoy());

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold text-brie-violet-deep">Hacer un pedido</h1>
        <p className="mt-1 text-foreground/70">
          {hoyDisponible
            ? `Pedidos para hoy hasta las ${horaCorte} hs.`
            : `El corte de hoy (${horaCorte} hs) ya pasó: podés pedir para los próximos días.`}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {fechas.slice(0, 6).map((f) => (
            <Link
              key={f}
              href={`/pedir?fecha=${f}`}
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

        {menus.length === 0 ? (
          <div className="card mt-6 text-center text-foreground/70">
            Todavía no publicamos el menú del {fmtFecha(fecha)}. ¡Probá con otra fecha!
          </div>
        ) : (
          <Carrito
            key={fecha}
            fecha={fecha}
            fechaLabel={fmtFecha(fecha)}
            menus={menus.map((m) => ({
              id: m.id,
              nombre: m.vianda.nombre,
              descripcion: m.vianda.descripcion,
              categoria: m.vianda.categoria,
              precio: session.grupo === "EMPRESA" ? m.precioEmpresa : m.precioIndividuo,
              disponibles: m.disponibles,
            }))}
            perfil={{
              direccion: usuario?.direccion ?? "",
              piso: usuario?.piso ?? "",
              zona: usuario?.zona ?? "NORTE",
              restricciones: usuario?.restricciones ?? "",
            }}
          />
        )}
      </main>
    </>
  );
}
