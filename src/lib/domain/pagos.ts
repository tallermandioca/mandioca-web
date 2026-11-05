import type { EstadoOrden } from "./ordenes";

/** Orders whose work is done: only these count as debt for the reminder. */
export const ESTADOS_COBRABLES: readonly EstadoOrden[] = ["listo", "entregado"];

interface OrdenCobro {
  estado: EstadoOrden;
  presupuesto: number | string | null;
  importe: number | string | null;
}

function numero(v: number | string | null | undefined): number {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** What the order costs: the final amount once closed, otherwise the quote. */
export function totalOrden(o: OrdenCobro): number {
  return o.importe !== null && o.importe !== "" ? numero(o.importe) : numero(o.presupuesto);
}

export function sumarPagos(pagos: { monto: number | string }[]): number {
  return Math.round(pagos.reduce((s, p) => s + numero(p.monto), 0) * 100) / 100;
}

/** Remaining balance, never negative (overpayments show as zero). Cancelled orders owe nothing. */
export function saldoOrden(o: OrdenCobro, pagado: number): number {
  if (o.estado === "cancelado") return 0;
  return Math.max(Math.round((totalOrden(o) - pagado) * 100) / 100, 0);
}

/** Orders with work done and money still owed, with their balance. */
export function ordenesConDeuda<T extends OrdenCobro & { id: string }>(
  ordenes: T[],
  pagadoPorOrden: Map<string, number>,
): { orden: T; saldo: number }[] {
  return ordenes
    .filter((o) => ESTADOS_COBRABLES.includes(o.estado))
    .map((orden) => ({ orden, saldo: saldoOrden(orden, pagadoPorOrden.get(orden.id) ?? 0) }))
    .filter((d) => d.saldo > 0);
}
