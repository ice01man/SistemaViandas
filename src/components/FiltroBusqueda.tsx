"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch } from "@/components/icons";

/**
 * Buscador que sincroniza su texto con un parámetro de la URL (con debounce),
 * para que las páginas del panel filtren en el servidor sin recargar.
 */
export default function FiltroBusqueda({
  placeholder = "Buscar...",
  param = "q",
  className = "",
}: {
  placeholder?: string;
  param?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function aplicar(valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor.trim()) params.set(param, valor.trim());
    else params.delete(param);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className={`relative ${className}`}>
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
      <input
        type="search"
        className="input w-full pl-9"
        placeholder={placeholder}
        defaultValue={searchParams.get(param) ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => aplicar(v), 300);
        }}
      />
    </div>
  );
}
