import Link from "next/link";
import Navbar from "@/components/Navbar";
import ActivarPush from "@/components/ActivarPush";
import { requireRol } from "@/lib/auth";
import { db } from "@/lib/db";
import { marcarTodasLeidas, limpiarLeidas } from "@/lib/actions/notificaciones";
import { IconBell } from "@/components/icons";

export const dynamic = "force-dynamic";

function fechaHora(d: Date) {
  return d.toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificacionesPage() {
  const session = await requireRol();

  const notificaciones = await db.notificacion.findMany({
    where: { userId: session.id },
    orderBy: { id: "desc" },
    take: 100,
  });
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const leidas = notificaciones.length - noLeidas;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold text-brie-violet-deep">
            <IconBell className="h-7 w-7" /> Notificaciones
          </h1>
          <div className="flex gap-2">
            {noLeidas > 0 && (
              <form action={marcarTodasLeidas}>
                <button className="btn-primary text-xs">Marcar todas leídas</button>
              </form>
            )}
            {leidas > 0 && (
              <form action={limpiarLeidas}>
                <button className="btn-outline text-xs">Borrar leídas</button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6">
          <ActivarPush />
        </div>

        <div className="mt-6 space-y-2">
          {notificaciones.length === 0 && (
            <div className="card text-center text-foreground/70">
              No tenés notificaciones todavía. Acá vas a ver los avisos sobre tus pedidos.
            </div>
          )}
          {notificaciones.map((n) => {
            const contenido = (
              <div className="flex items-start gap-3">
                {!n.leida && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brie-orange" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brie-violet-deep">{n.titulo}</p>
                  <p className="text-sm text-foreground/75">{n.mensaje}</p>
                </div>
                <span className="shrink-0 text-xs text-foreground/50">{fechaHora(n.createdAt)}</span>
              </div>
            );
            return n.url ? (
              <Link
                key={n.id}
                href={n.url}
                className={`card block py-3 transition hover:-translate-y-0.5 ${n.leida ? "opacity-70" : ""}`}
              >
                {contenido}
              </Link>
            ) : (
              <div key={n.id} className={`card py-3 ${n.leida ? "opacity-70" : ""}`}>
                {contenido}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
