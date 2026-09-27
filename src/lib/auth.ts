import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE = "brie_session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "brie-dev-secret");

export type Session = {
  id: number;
  nombre: string;
  rol: string;
  grupo: string;
};

export async function crearSesion(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function cerrarSesion() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      nombre: payload.nombre as string,
      rol: payload.rol as string,
      grupo: payload.grupo as string,
    };
  } catch {
    return null;
  }
}

/** Exige sesión con alguno de los roles dados; si no, redirige. */
export async function requireRol(...roles: string[]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (roles.length && !roles.includes(s.rol)) redirect("/");
  return s;
}

export async function getConfig(clave: string, porDefecto: string): Promise<string> {
  const c = await db.config.findUnique({ where: { clave } });
  return c?.valor ?? porDefecto;
}

export async function setConfig(clave: string, valor: string) {
  await db.config.upsert({
    where: { clave },
    update: { valor },
    create: { clave, valor },
  });
}
