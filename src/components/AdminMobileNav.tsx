"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import NotificacionesBell from "@/components/NotificacionesBell";
import { SECCIONES_ADMIN } from "@/components/adminNav";
import { IconMenu, IconX } from "@/components/icons";

/** Barra superior del panel admin en celulares/tablets, con menú hamburguesa. */
export default function AdminMobileNav({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  return (
    <div className="no-print sticky top-0 z-40 border-b border-white/10 bg-brie-night text-white lg:hidden">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setAbierto(false)}>
          <Image src="/logo_brie.png" alt="Brie" width={32} height={32} className="rounded-full" />
          <span className="text-sm font-semibold text-white/80">Administración</span>
        </Link>
        <div className="ml-auto">
          <NotificacionesBell tono="oscuro" />
        </div>
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl hover:bg-white/10"
        >
          {abierto ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {abierto && (
        <div className="border-t border-white/10 px-3 pb-3">
          <nav className="mt-2 grid gap-1 sm:grid-cols-2">
            {SECCIONES_ADMIN.map(({ href, label, icono: Icono }) => {
              const activa = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAbierto(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    activa ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  <Icono className="h-4.5 w-4.5 shrink-0 opacity-80" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 px-2 pt-3">
            <span className="text-sm font-bold">{nombre}</span>
            <div className="flex items-center gap-2">
              <ThemeToggle className="text-white hover:bg-white/10" />
              <form action={logout}>
                <button className="cursor-pointer rounded-xl px-3 py-2 text-xs font-bold text-white/80 ring-1 ring-white/30 hover:bg-white/10">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
