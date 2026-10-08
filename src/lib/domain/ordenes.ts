/**
 * Order state machine. Mirrors fn_transicion_valida in supabase/migrations/0003.
 * recibido -> presupuestado -> aprobado -> en_proceso -> listo -> entregado
 * cancelado is reachable from any state before listo.
 * Templates that do not require a quote may jump recibido -> en_proceso.
 */
export const ESTADOS_ORDEN = [
  "recibido",
  "presupuestado",
  "aprobado",
  "en_proceso",
  "listo",
  "entregado",
  "cancelado",
] as const;

export type EstadoOrden = (typeof ESTADOS_ORDEN)[number];

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibido: "Recibido",
  presupuestado: "Presupuestado",
  aprobado: "Aprobado",
  en_proceso: "En proceso",
  listo: "Para retirar",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** States that count as "open" in the workshop panel. */
export const ESTADOS_ABIERTOS: readonly EstadoOrden[] = [
  "recibido",
  "presupuestado",
  "aprobado",
  "en_proceso",
  "listo",
];

/** States that count as "closed" work (history, portfolio, seal). */
export const ESTADOS_CERRADOS: readonly EstadoOrden[] = ["listo", "entregado"];

export function transicionValida(desde: EstadoOrden, hacia: EstadoOrden, saltaPresupuesto: boolean): boolean {
  if (desde === hacia) return true;
  if (hacia === "cancelado") return desde !== "listo" && desde !== "entregado" && desde !== "cancelado";
  switch (desde) {
    case "recibido":
      return hacia === "presupuestado" || (saltaPresupuesto && hacia === "en_proceso");
    case "presupuestado":
      return hacia === "aprobado";
    case "aprobado":
      return hacia === "en_proceso";
    case "en_proceso":
      return hacia === "listo";
    case "listo":
      return hacia === "entregado";
    default:
      return false;
  }
}

export function siguientesEstados(desde: EstadoOrden, saltaPresupuesto: boolean): EstadoOrden[] {
  return ESTADOS_ORDEN.filter((hacia) => hacia !== desde && transicionValida(desde, hacia, saltaPresupuesto));
}
