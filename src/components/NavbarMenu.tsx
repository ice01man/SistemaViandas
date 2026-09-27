"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { IconMenu, IconX } from "@/components/icons";

/** Menú hamburguesa del navbar en celulares/tablets: links, tema y sesión. */
export default function NavbarMenu({
  links,
  nombre,
}: {
  links: { href: string; label: string }[];
  nombre: string | null;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-brie-violet-dark ring-1 ring-brie-lavender/70 hover:bg-brie-lavender-light"
      >
        {abierto ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
      </button>

      {abierto && (
        <>
          {/* Fondo para cerrar tocando afuera */}
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute inset-x-3 top-full z-50 mt-2 rounded-2xl border border-white/50 bg-surface/95 p-3 shadow-xl shadow-brie-violet-deep/10 backdrop-blur-xl dark:border-white/10">
            {nombre && (
              <div className="flex items-center gap-2.5 border-b border-brie-lavender-light px-2 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brie-solid text-sm font-extrabold text-white">
                  {nombre.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-bold text-brie-violet-dark">
                  Hola, {nombre.split(" ")[0]}
                </span>
              </div>
            )}

            <nav className="mt-2 space-y-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setAbierto(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-bold text-brie-violet-dark hover:bg-brie-lavender-light"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-brie-lavender-light px-2 pt-3">
              <ThemeToggle className="text-brie-violet-dark ring-1 ring-brie-lavender/70 hover:bg-brie-lavender-light" />
              {nombre ? (
                <form action={logout}>
                  <button className="btn-outline text-xs">Cerrar sesión</button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setAbierto(false)}
                  className="btn-primary text-xs"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
