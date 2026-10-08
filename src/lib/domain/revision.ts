/**
 * Next-revision rules. All dates are treated as calendar days (local midnight).
 * Mirrors fn_ordenes_cerrada in supabase/migrations/0003.
 */
export type Semaforo = "vencida" | "proxima" | "al_dia" | "sin_fecha";

export const DIAS_AVISO_PREVIO = 7;
export const DIAS_PROXIMA = 30;

const MS_POR_DIA = 86_400_000;

function soloFecha(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** Adds months the way Postgres does: overflowing days clamp to the last day of the month. */
export function calcularProximaRevision(fechaCierre: Date, meses: number): Date {
  const base = soloFecha(fechaCierre);
  const objetivo = new Date(base.getFullYear(), base.getMonth() + meses, 1);
  const ultimoDia = new Date(objetivo.getFullYear(), objetivo.getMonth() + 1, 0).getDate();
  objetivo.setDate(Math.min(base.getDate(), ultimoDia));
  return objetivo;
}

export function fechaRecordatorio(proximaRevision: Date): Date {
  const fecha = soloFecha(proximaRevision);
  fecha.setDate(fecha.getDate() - DIAS_AVISO_PREVIO);
  return fecha;
}

export function diasHasta(desde: Date, hasta: Date): number {
  return Math.round((soloFecha(hasta).getTime() - soloFecha(desde).getTime()) / MS_POR_DIA);
}

export function semaforo(proximaRevision: Date | null, hoy: Date = new Date()): Semaforo {
  if (!proximaRevision) return "sin_fecha";
  const dias = diasHasta(hoy, proximaRevision);
  if (dias < 0) return "vencida";
  if (dias <= DIAS_PROXIMA) return "proxima";
  return "al_dia";
}

export const ETIQUETA_SEMAFORO: Record<Semaforo, string> = {
  vencida: "Calibración vencida",
  proxima: "Revisión próxima",
  al_dia: "Al día",
  sin_fecha: "Sin revisión programada",
};
