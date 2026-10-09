/** Calendar "today" for the workshop (Argentina), independent of the server's timezone. */
export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export function hoyArgentina(ahora: Date = new Date()): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return new Date(valor("year"), valor("month") - 1, valor("day"));
}

export function sumarDias(fecha: Date, dias: number): Date {
  const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  f.setDate(f.getDate() + dias);
  return f;
}
