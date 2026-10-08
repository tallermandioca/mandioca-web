import type { FiltrosVenta } from "@/lib/datos/publico";
import type { Database } from "@/lib/supabase/types";

type TipoInstrumento = Database["public"]["Enums"]["tipo_instrumento"];
export const TIPOS_INSTRUMENTO: TipoInstrumento[] = ["electrica", "acustica", "criolla", "bajo", "otro"];

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function numero(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosVenta {
  const tipo = primero(sp.tipo);
  const orden = primero(sp.orden);
  return {
    tipo: TIPOS_INSTRUMENTO.includes(tipo as TipoInstrumento) ? (tipo as TipoInstrumento) : undefined,
    precioMin: numero(primero(sp.min)),
    precioMax: numero(primero(sp.max)),
    revisado: primero(sp.revisado) === "1",
    estuche: primero(sp.estuche) === "1",
    permuta: primero(sp.permuta) === "1",
    orden: orden === "precio_asc" || orden === "precio_desc" ? orden : "fecha",
  };
}

export function hrefCon(filtros: FiltrosVenta, cambios: Partial<FiltrosVenta>): string {
  const f = { ...filtros, ...cambios };
  const params = new URLSearchParams();
  if (f.tipo) params.set("tipo", f.tipo);
  if (f.precioMin !== undefined) params.set("min", String(f.precioMin));
  if (f.precioMax !== undefined) params.set("max", String(f.precioMax));
  if (f.revisado) params.set("revisado", "1");
  if (f.estuche) params.set("estuche", "1");
  if (f.permuta) params.set("permuta", "1");
  if (f.orden && f.orden !== "fecha") params.set("orden", f.orden);
  const qs = params.toString();
  return qs ? `/en-venta?${qs}` : "/en-venta";
}
