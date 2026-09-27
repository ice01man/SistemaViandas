// Helpers de fechas. Las fechas de entrega se manejan como strings YYYY-MM-DD
// en hora local, y la ventana de pedidos se controla con la hora de corte
// configurable desde Administración.

export function hoy(): string {
  return toYMD(new Date());
}

export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function esDiaHabil(d: Date): boolean {
  const dow = d.getDay();
  return dow >= 1 && dow <= 5;
}

export function fmtFecha(s: string): string {
  const d = fromYMD(s);
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function fmtFechaCorta(s: string): string {
  const d = fromYMD(s);
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

/** Lunes de la semana que contiene a `d`, como YYYY-MM-DD. */
export function inicioSemana(d = new Date()): string {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return toYMD(x);
}

/** Primer día del mes de `d`, como YYYY-MM-DD. */
export function inicioMes(d = new Date()): string {
  return toYMD(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Fecha de hace `dias` días, como YYYY-MM-DD. */
export function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return toYMD(d);
}

/** true si ya pasó la hora de corte (formato "HH:MM") para pedidos de HOY */
export function pasoElCorte(horaCorte: string, ahora = new Date()): boolean {
  const [h, m] = horaCorte.split(":").map(Number);
  return ahora.getHours() > h || (ahora.getHours() === h && ahora.getMinutes() >= m);
}

/**
 * Fechas de entrega disponibles para pedir: los próximos días hábiles.
 * Hoy solo está disponible si todavía no pasó la hora de corte.
 */
export function fechasDisponibles(horaCorte: string, cantidad = 7): string[] {
  const out: string[] = [];
  const d = new Date();
  if (esDiaHabil(d) && !pasoElCorte(horaCorte)) out.push(toYMD(d));
  while (out.length < cantidad) {
    d.setDate(d.getDate() + 1);
    if (esDiaHabil(d)) out.push(toYMD(d));
  }
  return out;
}

/** Días hábiles (lun-vie) de la semana que contiene a `base`, más la siguiente. */
export function diasHabilesProximos(cantidad = 10): string[] {
  const out: string[] = [];
  const d = new Date();
  while (out.length < cantidad) {
    if (esDiaHabil(d)) out.push(toYMD(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
