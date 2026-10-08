import { ESTADOS_CERRADOS, type EstadoOrden } from "./ordenes";
import { calcularProximaRevision } from "./revision";

/** "Revisado por el taller" needs a closed order from the last six months. */
export const MESES_VIGENCIA_SELLO = 6;

export interface OrdenParaSello {
  estado: EstadoOrden;
  fecha_cierre: Date | null;
}

export function puedeMarcarSello(orden: OrdenParaSello | null, hoy: Date = new Date()): boolean {
  if (!orden || !orden.fecha_cierre) return false;
  if (!ESTADOS_CERRADOS.includes(orden.estado)) return false;
  const vence = calcularProximaRevision(orden.fecha_cierre, MESES_VIGENCIA_SELLO);
  return vence.getTime() >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
}
