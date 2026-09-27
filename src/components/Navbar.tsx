import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "./ThemeToggle";
import NavbarMenu from "./NavbarMenu";
import NotificacionesBell from "./NotificacionesBell";

const LINKS_POR_ROL: Record<string, { href: string; label: string }[]> = {
  CLIENTE: [
    { href: "/pedir", label: "Hacer pedido" },
    { href: "/mis-pedidos", label: "Mis pedidos" },
  ],
  ADMIN: [{ href: "/admin", label: "Administración" }],
  COCINA: [{ href: "/cocina", label: "Panel de cocina" }],
  DELIVERY: [{ href: "/delivery", label: "Mis entregas" }],
};

export default async function Navbar() {
  const session = await getSession();
  const links = session ? LINKS_POR_ROL[session.rol] ?? [] : [];

  return (
    <header className="no-print sticky top-0 z-40 px-3 pt-3">
      {/* Barra liquid glass flotante */}
      <div className="relative mx-auto max-w-6xl rounded-2xl border border-white/50 bg-surface/60 shadow-lg shadow-brie-violet-deep/5 backdrop-blur-xl dark:border-white/10">
        <nav className="flex items-center gap-3 px-4 py-2">
          <Link href="/" className="font-brand text-3xl leading-none text-brie-violet">
            Brie
          </Link>

          {/* Links en desktop */}
          <div className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="btn-ghost">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Controles en desktop */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {session && (
              <span className="mr-1 flex items-center gap-2 rounded-full bg-brie-lavender-light/70 py-1 pl-1 pr-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brie-solid text-sm font-extrabold text-white">
                  {session.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-brie-violet-dark">
                  Hola, {session.nombre.split(" ")[0]}
                </span>
              </span>
            )}
            {session && <NotificacionesBell />}
            <ThemeToggle className="text-brie-violet-dark ring-1 ring-brie-lavender/70 hover:bg-brie-lavender-light" />
            {session ? (
              <form action={logout}>
                <button className="btn-outline">Salir</button>
              </form>
            ) : (
              <Link href="/login" className="btn-primary">
                Ingresar
              </Link>
            )}
          </div>

          {/* Hamburguesa en mobile/tablet */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            {session && <NotificacionesBell />}
            <NavbarMenu links={links} nombre={session?.nombre ?? null} />
          </div>
        </nav>
      </div>
    </header>
  );
}
