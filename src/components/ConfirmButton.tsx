"use client";

import type { ReactNode } from "react";

/** Botón de submit que pide confirmación antes de enviar el formulario. */
export default function ConfirmButton({
  mensaje,
  className = "",
  children,
}: {
  mensaje: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
