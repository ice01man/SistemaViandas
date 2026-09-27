"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crearSesion, cerrarSesion, getSession } from "@/lib/auth";

export type FormState = { error?: string };

function destinoPorRol(rol: string) {
  switch (rol) {
    case "ADMIN":
      return "/admin";
    case "COCINA":
      return "/cocina";
    case "DELIVERY":
      return "/delivery";
    default:
      return "/pedir";
  }
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.activo) return { error: "Usuario o contraseña incorrectos." };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { error: "Usuario o contraseña incorrectos." };

  await crearSesion({ id: user.id, nombre: user.nombre, rol: user.rol, grupo: user.grupo });
  redirect(destinoPorRol(user.rol));
}

export async function registro(_prev: FormState, formData: FormData): Promise<FormState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const telefono = String(formData.get("telefono") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const piso = String(formData.get("piso") ?? "").trim();
  const zona = String(formData.get("zona") ?? "NORTE");
  const restricciones = String(formData.get("restricciones") ?? "").trim();

  if (!nombre || !email || !password || !direccion || !telefono)
    return { error: "Completá todos los campos obligatorios." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const existe = await db.user.findUnique({ where: { email } });
  if (existe) return { error: "Ya existe una cuenta con ese email." };

  const user = await db.user.create({
    data: {
      nombre,
      email,
      password: await bcrypt.hash(password, 10),
      telefono,
      direccion,
      piso: piso || null,
      zona,
      restricciones: restricciones || null,
      rol: "CLIENTE",
      grupo: "INDIVIDUO",
    },
  });

  await crearSesion({ id: user.id, nombre: user.nombre, rol: user.rol, grupo: user.grupo });
  redirect("/pedir");
}

export async function logout() {
  await cerrarSesion();
  redirect("/");
}

export async function sesionActual() {
  return getSession();
}
