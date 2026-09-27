"use client";

import { useEffect, useRef, useState } from "react";
import { actualizarUbicacion, apagarUbicacion } from "@/lib/actions/notificaciones";
import { IconNavigation } from "@/components/icons";

const KEY = "brie-compartir-ubicacion";
const ENVIO_MINIMO_MS = 20_000; // no mandar la posición más seguido que esto

/**
 * Toggle del cadete para compartir su ubicación durante el reparto.
 * Mientras está activo, la posición se guarda en el servidor y el cliente
 * con un pedido en camino puede seguirlo desde "Mis pedidos".
 */
export default function CompartirUbicacion() {
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const ultimoEnvio = useRef(0);

  function detener(borrarServidor: boolean) {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (borrarServidor) apagarUbicacion().catch(() => {});
  }

  function iniciar() {
    if (!("geolocation" in navigator)) {
      setError("Este dispositivo no tiene GPS disponible.");
      return false;
    }
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ahora = Date.now();
        if (ahora - ultimoEnvio.current < ENVIO_MINIMO_MS) return;
        ultimoEnvio.current = ahora;
        actualizarUbicacion(pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Habilitalo en el navegador."
            : "No se pudo obtener la ubicación."
        );
        setActivo(false);
        try {
          localStorage.setItem(KEY, "0");
        } catch {}
      },
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    return true;
  }

  // Retoma el estado guardado al montar y limpia el watch al desmontar
  useEffect(() => {
    let recordado = false;
    try {
      recordado = localStorage.getItem(KEY) === "1";
    } catch {}
    if (recordado) setActivo(iniciar());
    return () => detener(false);
  }, []);

  function alternar() {
    const nuevo = !activo;
    if (nuevo) {
      const ok = iniciar();
      setActivo(ok);
      try {
        localStorage.setItem(KEY, ok ? "1" : "0");
      } catch {}
    } else {
      detener(true);
      setActivo(false);
      try {
        localStorage.setItem(KEY, "0");
      } catch {}
    }
  }

  return (
    <div className="card mt-4 flex flex-wrap items-center gap-3 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          activo ? "bg-green-100 text-green-700" : "bg-brie-lavender-light text-brie-violet"
        }`}
      >
        <IconNavigation className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-brie-violet-deep">Compartir mi ubicación</p>
        <p className="text-xs text-foreground/70">
          {error ??
            (activo
              ? "Los clientes con pedidos en camino pueden seguirte en el mapa."
              : "Activala al salir a repartir para que el cliente siga su pedido.")}
        </p>
      </div>
      <button
        type="button"
        onClick={alternar}
        role="switch"
        aria-checked={activo}
        aria-label="Compartir mi ubicación"
        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition ${
          activo ? "bg-green-600" : "bg-brie-lavender"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${
            activo ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
