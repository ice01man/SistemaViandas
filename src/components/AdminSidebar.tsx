"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import NotificacionesBell from "@/components/NotificacionesBell";
import { SECCIONES_ADMIN } from "@/components/adminNav";
import { IconChevronLeft } from "@/components/icons";

const KEY = "brie-sidebar-colapsado";

/** Sidebar del panel admin, colapsable a solo íconos (preferencia recordada). */
export default function AdminSidebar({ nombre }: { nombre: string }) {
  const [colapsado, setColapsado] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setColapsado(localStorage.getItem(KEY) === "1");
    } catch {}
  }, []);

  function alternar() {
    setColapsado((c) => {
      try {
        localStorage.setItem(KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <aside
      className={`no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-brie-lavender-light bg-brie-night text-white transition-[width] duration-200 lg:flex ${
        colapsado ? "w-[4.5rem]" : "w-64"
      }`}
    >
      <div
        className={`flex items-center py-5 ${colapsado ? "flex-col gap-3 px-0" : "gap-3 px-5"}`}
      >
        <Link href="/" className="flex items-center gap-3" title="Ir al inicio">
          <Image src="/logo_brie.png" alt="Brie" width={44} height={44} className="rounded-full" />
          {!colapsado && (
            <div>
              <span className="font-brand text-2xl">Brie</span>
              <p className="text-xs text-white/70">Administración</p>
            </div>
          )}
        </Link>
        <div className={colapsado ? "" : "ml-auto"}>
          <NotificacionesBell tono="oscuro" alinear="izquierda" />
        </div>
      </div>

      <nav className={`flex-1 space-y-1 ${colapsado ? "px-2.5" : "px-3"}`}>
        {SECCIONES_ADMIN.map(({ href, label, icono: Icono }) => {
          const activa = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={colapsado ? label : undefined}
              className={`flex items-center gap-2.5 rounded-xl text-sm font-semibold ${
                activa ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10"
              } ${colapsado ? "justify-center px-0 py-2.5" : "px-3 py-2"}`}
            >
              <Icono className="h-4.5 w-4.5 shrink-0 opacity-80" />
              {!colapsado && label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={alternar}
        title={colapsado ? "Expandir menú" : "Colapsar menú"}
        className={`mx-auto mb-2 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white ${
          colapsado ? "" : "self-start"
        }`}
      >
        <IconChevronLeft
          className={`h-4 w-4 transition-transform duration-200 ${colapsado ? "rotate-180" : ""}`}
        />
        {!colapsado && "Colapsar menú"}
      </button>

      <div
        className={`border-t border-white/10 py-4 ${
          colapsado ? "flex flex-col items-center gap-3 px-0" : "flex items-center justify-between px-5"
        }`}
      >
        {!colapsado && (
          <div>
            <p className="text-sm font-bold">{nombre}</p>
            <form action={logout}>
              <button className="mt-1 cursor-pointer text-xs text-white/70 hover:text-white">
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
        <ThemeToggle className="text-white hover:bg-white/10" />
        {colapsado && (
          <form action={logout} title="Cerrar sesión">
            <button className="cursor-pointer text-xs text-white/70 hover:text-white">Salir</button>
          </form>
        )}
      </div>
    </aside>
  );
}
