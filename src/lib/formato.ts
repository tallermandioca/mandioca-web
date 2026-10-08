/** Formatting helpers for the Argentine locale. */

const fechaCorta = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fechaLarga = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });

/** Parses a Postgres `date` (YYYY-MM-DD) as a local calendar day. */
export function fechaDesdeIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function aIsoFecha(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatearFecha(iso: string | Date | null | undefined): string {
  const fecha = iso instanceof Date ? iso : fechaDesdeIso(iso);
  return fecha ? fechaCorta.format(fecha) : "—";
}

/** "09/2026", always two-digit month (Intl drops the zero for es-AR). */
export function formatearMesAnio(iso: string | Date | null | undefined): string {
  const fecha = iso instanceof Date ? iso : fechaDesdeIso(iso);
  if (!fecha) return "—";
  return `${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`;
}

export function formatearFechaLarga(fecha: Date): string {
  return fechaLarga.format(fecha);
}

export function formatearImporte(valor: number | string | null | undefined, moneda = "ARS"): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(numero)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(numero);
}

export const ETIQUETA_TIPO_INSTRUMENTO: Record<string, string> = {
  electrica: "Guitarra eléctrica",
  acustica: "Guitarra acústica",
  criolla: "Guitarra criolla",
  bajo: "Bajo",
  otro: "Otro",
};

export const ETIQUETA_ESTADO_INSTRUMENTO: Record<string, string> = {
  excelente: "Excelente",
  muy_bueno: "Muy bueno",
  bueno: "Bueno",
  regular: "Regular",
};

/** "Fender Telecaster '78" from brand/model/year. */
export function nombreInstrumento(i: { marca: string | null; modelo: string | null; tipo?: string }): string {
  const partes = [i.marca, i.modelo].filter((p): p is string => Boolean(p));
  if (partes.length > 0) return partes.join(" ");
  return i.tipo ? (ETIQUETA_TIPO_INSTRUMENTO[i.tipo] ?? "Instrumento") : "Instrumento";
}
