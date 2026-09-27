"use client";

import { useActionState, useState } from "react";
import { login, registro, type FormState } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";

/** Cierra el teclado en celulares/tablets al enviar el formulario. */
function cerrarTeclado() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

/* ---------- Formulario de login ---------- */

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={formAction} onSubmit={cerrarTeclado} className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-white">Ingresar</h2>
        <p className="mt-1 text-sm text-white/70">Accedé con tu cuenta de Brie</p>
      </div>

      <label className="block">
        <span className="label-glass">Email</span>
        <input className="input-glass" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block">
        <span className="label-glass">Contraseña</span>
        <PasswordInput
          className="input-glass"
          tono="claro"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>

      {state.error && (
        <p className="rounded-xl bg-red-500/25 px-3 py-2 text-sm font-semibold text-red-100 ring-1 ring-red-300/40">
          {state.error}
        </p>
      )}

      <button className="btn-orange w-full py-3 shadow-lg shadow-brie-orange/30" disabled={pending}>
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-sm text-white/70 md:hidden">
        ¿No tenés cuenta?{" "}
        <button type="button" onClick={onSwitch} className="font-bold text-white underline">
          Registrate
        </button>
      </p>
    </form>
  );
}

/* ---------- Formulario de registro ---------- */

function RegistroForm({ onSwitch }: { onSwitch: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(registro, {});
  return (
    <form action={formAction} onSubmit={cerrarTeclado} className="w-full space-y-3">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-white">Crear cuenta</h2>
        <p className="mt-1 text-sm text-white/70">Pedí tus viandas todos los días</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label-glass">Nombre y apellido *</span>
          <input className="input-glass" name="nombre" autoComplete="name" required />
        </label>
        <label className="block">
          <span className="label-glass">Teléfono *</span>
          <input className="input-glass" name="telefono" placeholder="342-..." required />
        </label>
      </div>

      <label className="block">
        <span className="label-glass">Email *</span>
        <input className="input-glass" name="email" type="email" autoComplete="email" required />
      </label>

      <label className="block">
        <span className="label-glass">Contraseña *</span>
        <PasswordInput
          className="input-glass"
          tono="claro"
          name="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="col-span-2 block">
          <span className="label-glass">Dirección *</span>
          <input className="input-glass" name="direccion" placeholder="Calle y número" required />
        </label>
        <label className="block">
          <span className="label-glass">Piso / Depto</span>
          <input className="input-glass" name="piso" placeholder="3° B" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label-glass">Zona *</span>
          <select className="input-glass [&>option]:text-brie-night" name="zona" defaultValue="SUR">
            <option value="SUR">Zona Sur</option>
            <option value="CENTRO">Zona Centro</option>
            <option value="NORTE">Zona Norte</option>
          </select>
        </label>
        <label className="block">
          <span className="label-glass">Restricciones</span>
          <input className="input-glass" name="restricciones" placeholder="Sin TACC, alergias..." />
        </label>
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-500/25 px-3 py-2 text-sm font-semibold text-red-100 ring-1 ring-red-300/40">
          {state.error}
        </p>
      )}

      <button className="btn-orange w-full py-3 shadow-lg shadow-brie-orange/30" disabled={pending}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-white/70 md:hidden">
        ¿Ya tenés cuenta?{" "}
        <button type="button" onClick={onSwitch} className="font-bold text-white underline">
          Ingresá
        </button>
      </p>
    </form>
  );
}

/* ---------- Panel combinado con overlay deslizante ---------- */

export default function AuthPanel({ inicial = "login" }: { inicial?: "login" | "registro" }) {
  const [modo, setModo] = useState<"login" | "registro">(inicial);
  const esRegistro = modo === "registro";

  return (
    <div className="relative z-10 w-full max-w-md md:max-w-4xl">
      {/* ===== Mobile: tabs + slider horizontal ===== */}
      <div className="glass overflow-hidden md:hidden">
        <div className="m-4 mb-0 flex rounded-2xl bg-white/10 p-1 backdrop-blur">
          {(["login", "registro"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 ${
                modo === m ? "bg-white text-[#5d4e8e] shadow" : "text-white/75"
              }`}
            >
              {m === "login" ? "Ingresar" : "Crear cuenta"}
            </button>
          ))}
        </div>
        <div className="overflow-hidden">
          <div key={modo} className="animate-slide-in p-6">
            {esRegistro ? (
              <RegistroForm onSwitch={() => setModo("login")} />
            ) : (
              <LoginForm onSwitch={() => setModo("registro")} />
            )}
          </div>
        </div>
      </div>

      {/* ===== Desktop: login a la izquierda, registro a la derecha, overlay deslizante ===== */}
      <div className="glass relative hidden min-h-[660px] overflow-hidden md:block">
        {/* Login (mitad izquierda) */}
        <div
          className={`absolute inset-y-0 left-0 flex w-1/2 items-center p-10 transition-all duration-700 ease-in-out ${
            esRegistro ? "pointer-events-none -translate-x-8 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <LoginForm onSwitch={() => setModo("registro")} />
        </div>

        {/* Registro (mitad derecha) */}
        <div
          className={`absolute inset-y-0 right-0 flex w-1/2 items-center overflow-y-auto p-10 transition-all duration-700 ease-in-out ${
            esRegistro ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"
          }`}
        >
          <RegistroForm onSwitch={() => setModo("login")} />
        </div>

        {/* Overlay que se desliza: arranca tapando el registro (derecha) */}
        <div
          className={`absolute inset-y-0 left-1/2 z-20 w-1/2 transition-transform duration-700 ease-in-out ${
            esRegistro ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#8471c9]/95 via-[#6a58a8]/95 to-[#453a6b]/95 p-10 text-center text-white backdrop-blur-xl">
            {/* Decoración */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full border-2 border-dashed border-white/20 animate-spin-slow" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            {/* Mensaje: invitar a registrarse (overlay sobre la derecha) */}
            <div
              className={`flex flex-col items-center gap-4 transition-all duration-500 ${
                esRegistro
                  ? "pointer-events-none absolute -translate-y-6 opacity-0"
                  : "translate-y-0 opacity-100 delay-200"
              }`}
            >
              <span className="font-brand text-4xl">Brie</span>
              <h3 className="text-2xl font-extrabold">¿Primera vez por acá?</h3>
              <p className="max-w-xs text-sm text-white/80">
                Creá tu cuenta con tus datos de entrega y empezá a pedir tus viandas saludables hoy
                mismo.
              </p>
              <button type="button" onClick={() => setModo("registro")} className="btn-ghost-glass">
                Registrate
              </button>
            </div>

            {/* Mensaje: volver al login (overlay sobre la izquierda) */}
            <div
              className={`flex flex-col items-center gap-4 transition-all duration-500 ${
                esRegistro
                  ? "translate-y-0 opacity-100 delay-200"
                  : "pointer-events-none absolute translate-y-6 opacity-0"
              }`}
            >
              <span className="font-brand text-4xl">Brie</span>
              <h3 className="text-2xl font-extrabold">¡Bienvenido de nuevo!</h3>
              <p className="max-w-xs text-sm text-white/80">
                Si ya sos parte de Brie, ingresá con tu cuenta para seguir pidiendo tus viandas.
              </p>
              <button type="button" onClick={() => setModo("login")} className="btn-ghost-glass">
                Ingresar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
