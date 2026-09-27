"use client";

import { IconPrinter } from "./icons";

export default function PrintButton({ label = "Imprimir / Exportar PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline no-print">
      <IconPrinter className="h-4 w-4" /> {label}
    </button>
  );
}
