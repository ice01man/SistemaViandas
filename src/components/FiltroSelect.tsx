"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Select que sincroniza su valor con un parámetro de la URL, para filtrar
 * listados del panel en el servidor. La opción con valor "" quita el filtro.
 */
export default function FiltroSelect({
  param,
  opciones,
  className = "",
}: {
  param: string;
  opciones: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      className={`input ${className}`}
      value={searchParams.get(param) ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) params.set(param, e.target.value);
        else params.delete(param);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      {opciones.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
