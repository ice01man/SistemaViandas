"use client";

import { useEffect, useState } from "react";
import { activarPush, desactivarPush, estadoPush, type EstadoPush } from "@/lib/push-client";
import { IconBellRing } from "@/components/icons";

const DESCRIPCION: Record<EstadoPush, string> = {
  "no-soportado": "Este navegador no soporta notificaciones push.",
  "sin-clave": "El servidor no tiene configuradas las claves de push (VAPID).",
  denegado: "Bloqueaste las notificaciones para este sitio. Habilitalas desde la configuración del navegador.",
  activo: "Este dispositivo recibe avisos aunque la app esté cerrada.",
  inactivo: "Activalas para enterarte de tus pedidos aunque no tengas la app abierta.",
};

/** Tarjeta para activar/desactivar las notificaciones push de este navegador. */
export default function ActivarPush() {
  const [estado, setEstado] = useState<EstadoPush | "cargando">("cargando");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    estadoPush().then(setEstado);
  }, []);

  async function alternar() {
    if (estado === "cargando" || ocupado) return;
    setOcupado(true);
    try {
      setEstado(estado === "activo" ? await desactivarPush() : await activarPush());
    } finally {
      setOcupado(false);
    }
  }

  const puedeAlternar = estado === "activo" || estado === "inactivo";

  return (
    <div className="card flex flex-wrap items-center gap-3">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          estado === "activo" ? "bg-green-100 text-green-700" : "bg-brie-lavender-light text-brie-violet"
        }`}
      >
        <IconBellRing className="h-5.5 w-5.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-brie-violet-deep">Notificaciones en este dispositivo</p>
        <p className="text-sm text-foreground/70">
          {estado === "cargando" ? "Verificando…" : DESCRIPCION[estado]}
        </p>
      </div>
      {puedeAlternar && (
        <button
          type="button"
          onClick={alternar}
          disabled={ocupado}
          className={estado === "activo" ? "btn-outline text-xs" : "btn-primary text-xs"}
        >
          {ocupado ? "Un momento…" : estado === "activo" ? "Desactivar" : "Activar"}
        </button>
      )}
    </div>
  );
}
