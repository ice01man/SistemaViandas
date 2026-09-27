"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBell, IconX } from "@/components/icons";

type Notificacion = {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  url: string | null;
  leida: boolean;
  createdAt: string;
};

const INTERVALO_MS = 15_000;
const TOAST_MS = 8_000; // cuánto queda visible cada aviso flotante

// La campanita se monta más de una vez por página (versión desktop y mobile);
// solo una instancia se encarga de los avisos flotantes y el sonido.
let duenioDeAvisos: symbol | null = null;

/** "hace 5 min", "hace 2 h", "ayer", o la fecha corta. */
function tiempoRelativo(iso: string) {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/** Campanita corta de dos tonos vía WebAudio (sin archivos de audio). */
function sonarCampanita() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const ahora = ctx.currentTime;
    for (const [freq, inicio] of [
      [880, 0],
      [1174.7, 0.12],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ahora + inicio);
      gain.gain.exponentialRampToValueAtTime(0.08, ahora + inicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ahora + inicio);
      osc.stop(ahora + inicio + 0.45);
    }
    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {
    // sin permiso de audio todavía (falta interacción con la página): no pasa nada
  }
}

/**
 * Campanita de notificaciones con contador, panel desplegable y avisos
 * flotantes (toasts) cuando llega algo nuevo, sin recargar la página.
 * `tono` adapta los colores a la superficie (claro = navbar, oscuro = panel admin);
 * `alinear` define hacia qué lado se abre el panel.
 */
export default function NotificacionesBell({
  tono = "claro",
  alinear = "derecha",
}: {
  tono?: "claro" | "oscuro";
  alinear?: "derecha" | "izquierda";
}) {
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [avisos, setAvisos] = useState<Notificacion[]>([]);
  const contenedor = useRef<HTMLDivElement>(null);
  const instancia = useRef<symbol | null>(null);
  const ultimoId = useRef<number | null>(null);
  const router = useRouter();

  // Reclama (o libera) el rol de mostrar los avisos flotantes
  useEffect(() => {
    const yo = Symbol("bell");
    instancia.current = yo;
    if (duenioDeAvisos === null) duenioDeAvisos = yo;
    return () => {
      if (duenioDeAvisos === yo) duenioDeAvisos = null;
    };
  }, []);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones");
      if (!res.ok) return;
      const datos = (await res.json()) as { notificaciones: Notificacion[]; noLeidas: number };
      setItems(datos.notificaciones);
      setNoLeidas(datos.noLeidas);

      const mayorId = datos.notificaciones[0]?.id ?? 0;
      const esDuenio = duenioDeAvisos === instancia.current;
      if (ultimoId.current !== null && esDuenio) {
        const nuevas = datos.notificaciones.filter((n) => n.id > ultimoId.current! && !n.leida);
        if (nuevas.length > 0) {
          setAvisos((xs) => [...nuevas.slice(0, 3), ...xs].slice(0, 4));
          sonarCampanita();
          // Refresca los datos de la página (ej: el estado del pedido en Mis pedidos)
          router.refresh();
        }
      }
      ultimoId.current = Math.max(ultimoId.current ?? 0, mayorId);
    } catch {}
  }, [router]);

  // Carga inicial + polling + recarga al volver a la pestaña
  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_MS);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  // Los avisos flotantes se van solos después de un rato
  useEffect(() => {
    if (avisos.length === 0) return;
    const timer = setTimeout(() => setAvisos((xs) => xs.slice(0, -1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [avisos]);

  // Cierra el panel al clickear afuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const alClickear = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClickear);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alClickear);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  async function marcarLeidas(ids: number[] | "todas") {
    try {
      await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids === "todas" ? { todas: true } : { ids }),
      });
    } catch {}
  }

  async function abrirNotificacion(n: Notificacion) {
    setAbierto(false);
    setAvisos((xs) => xs.filter((x) => x.id !== n.id));
    if (!n.leida) {
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      setNoLeidas((c) => Math.max(0, c - 1));
      await marcarLeidas([n.id]);
    }
    if (n.url) router.push(n.url);
  }

  const oscuro = tono === "oscuro";
  const esDuenio = duenioDeAvisos === instancia.current;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => {
          setAbierto((a) => !a);
          if (!abierto) cargar();
        }}
        aria-label={noLeidas ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"}
        aria-expanded={abierto}
        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition ${
          oscuro
            ? "text-white hover:bg-white/10"
            : "text-brie-violet-dark ring-1 ring-brie-lavender/70 hover:bg-brie-lavender-light"
        }`}
      >
        <IconBell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brie-orange px-1 text-[10px] font-extrabold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className={`absolute top-12 z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-brie-lavender-light bg-surface shadow-2xl shadow-brie-violet-deep/15 ${
            alinear === "derecha" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-brie-lavender-light px-4 py-2.5">
            <span className="text-sm font-extrabold text-brie-violet-deep">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={() => {
                  setItems((xs) => xs.map((x) => ({ ...x, leida: true })));
                  setNoLeidas(0);
                  marcarLeidas("todas");
                }}
                className="cursor-pointer text-xs font-bold text-brie-violet hover:underline"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-foreground/60">
                No tenés notificaciones todavía.
              </p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => abrirNotificacion(n)}
                className={`block w-full cursor-pointer border-b border-brie-lavender-light/60 px-4 py-3 text-left last:border-b-0 hover:bg-brie-lavender-light/40 ${
                  n.leida ? "opacity-65" : ""
                }`}
              >
                <span className="flex items-start gap-2">
                  {!n.leida && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brie-orange" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brie-violet-deep">{n.titulo}</span>
                    <span className="block text-xs text-foreground/75">{n.mensaje}</span>
                    <span className="mt-0.5 block text-[11px] text-foreground/50">
                      {tiempoRelativo(n.createdAt)}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>

          <Link
            href="/notificaciones"
            onClick={() => setAbierto(false)}
            className="block border-t border-brie-lavender-light px-4 py-2.5 text-center text-xs font-bold text-brie-violet hover:bg-brie-lavender-light/40"
          >
            Ver todas
          </Link>
        </div>
      )}

      {/* Avisos flotantes: van en un portal para que no los oculte el navbar responsive */}
      {esDuenio &&
        avisos.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed right-3 top-20 z-[100] flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-2">
            {avisos.map((n) => (
              <div
                key={n.id}
                className="animate-slide-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-brie-lavender-light bg-surface px-4 py-3 shadow-2xl shadow-brie-violet-deep/20"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brie-lavender-light text-brie-violet">
                  <IconBell className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => abrirNotificacion(n)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <span className="block text-sm font-extrabold text-brie-violet-deep">
                    {n.titulo}
                  </span>
                  <span className="block text-xs text-foreground/75">{n.mensaje}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvisos((xs) => xs.filter((x) => x.id !== n.id))}
                  aria-label="Cerrar aviso"
                  className="shrink-0 cursor-pointer rounded-lg p-1 text-foreground/50 hover:bg-brie-lavender-light hover:text-foreground"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
