import { normalizarWhatsapp } from "@/lib/notificaciones/whatsapp";
import type { Database } from "@/lib/supabase/types";

/** FormData readers shared by the client/instrument/order actions. */

type TipoInstrumento = Database["public"]["Enums"]["tipo_instrumento"];
const TIPOS: TipoInstrumento[] = ["electrica", "acustica", "criolla", "bajo", "otro"];

function texto(formData: FormData, clave: string): string | null {
  const v = String(formData.get(clave) ?? "").trim();
  return v === "" ? null : v;
}

function numero(formData: FormData, clave: string): number | null {
  const v = texto(formData, clave);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function leerDatosCliente(formData: FormData): {
  nombre: string;
  whatsapp: string | null;
  email: string | null;
  canal_preferido: "whatsapp" | "email";
} {
  const whatsapp = normalizarWhatsapp(texto(formData, "whatsapp"));
  const email = texto(formData, "email")?.toLowerCase() ?? null;
  const canal = formData.get("canal_preferido") === "email" ? "email" : "whatsapp";
  return { nombre: texto(formData, "nombre") ?? "", whatsapp, email, canal_preferido: canal };
}

export function leerDatosInstrumento(formData: FormData) {
  const tipoRaw = String(formData.get("tipo") ?? "otro");
  const tipo: TipoInstrumento = TIPOS.includes(tipoRaw as TipoInstrumento)
    ? (tipoRaw as TipoInstrumento)
    : "otro";
  return {
    tipo,
    marca: texto(formData, "marca"),
    modelo: texto(formData, "modelo"),
    anio: numero(formData, "anio"),
    numero_serie: texto(formData, "numero_serie"),
    calibre_cuerdas: texto(formData, "calibre_cuerdas"),
    afinacion: texto(formData, "afinacion"),
    escala: texto(formData, "escala"),
    trastes_cantidad: numero(formData, "trastes_cantidad"),
    trastes_material: texto(formData, "trastes_material"),
    action_graves_mm: numero(formData, "action_graves_mm"),
    action_agudos_mm: numero(formData, "action_agudos_mm"),
    calibracion_cada_meses: numero(formData, "calibracion_cada_meses") ?? 6,
  };
}
