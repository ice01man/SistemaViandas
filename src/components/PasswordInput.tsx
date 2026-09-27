"use client";

import { useState, type InputHTMLAttributes } from "react";
import { IconEye, IconEyeOff } from "@/components/icons";

/**
 * Input de contraseña con botón de ojo para mostrarla u ocultarla.
 * `className` es la clase del input (p. ej. "input" o "input-glass");
 * `tono` ajusta el color del ojo al fondo del input.
 */
export default function PasswordInput({
  className = "input",
  tono = "oscuro",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { tono?: "claro" | "oscuro" }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-11`} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className={`absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center ${
          tono === "claro" ? "text-white/70 hover:text-white" : "text-foreground/50 hover:text-foreground/80"
        }`}
      >
        {visible ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}
