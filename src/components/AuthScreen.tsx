import Link from "next/link";
import AuthPanel from "./AuthPanel";
import { IconArrowLeft } from "./icons";

/** Pantalla compartida de autenticación: fondo con imagen + panel liquid glass. */
export default function AuthScreen({ inicial }: { inicial: "login" | "registro" }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-14 md:py-10">
      {/* Degradado de respaldo (se ve si falta la imagen) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#b7a8ea] via-[#8d7cc9] to-[#453a6b]" />
      {/* Imagen de fondo: guardar en public/auth-bg.jpg (1920x1280 recomendado) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth-bg.jpg')" }}
      />
      {/* Velo con los colores de la marca (más oscuro en tema oscuro) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#453a6b]/55 via-[#7a68b5]/30 to-[#f0873c]/25 dark:from-black/65 dark:via-[#241d3b]/60 dark:to-black/55" />

      {/* Volver al inicio */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20"
      >
        <IconArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <AuthPanel inicial={inicial} />
    </main>
  );
}
