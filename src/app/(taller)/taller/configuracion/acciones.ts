"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { parsearImporte } from "@/lib/formato";
import { normalizarWhatsapp } from "@/lib/notificaciones/whatsapp";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

function texto(formData: FormData, clave: string): string | null {
  const v = String(formData.get(clave) ?? "").trim();
  return v === "" ? null : v;
}

export async function guardarConfiguracion(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/configuracion");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("configuracion").upsert({
    id: true,
    nombre_taller: texto(formData, "nombre_taller") ?? "Taller de Instrumentos Mandioca",
    direccion: texto(formData, "direccion"),
    horario: texto(formData, "horario"),
    whatsapp: normalizarWhatsapp(texto(formData, "whatsapp")),
    email: texto(formData, "email")?.toLowerCase() ?? null,
    instagram_user: texto(formData, "instagram_user")?.replace(/^@/, "") ?? null,
    texto_aviso_calibracion: texto(formData, "texto_aviso_calibracion"),
    texto_aviso_listo: texto(formData, "texto_aviso_listo"),
    moderacion_automatica: formData.get("moderacion_automatica") !== null,
  });
  if (error) return { error: "No se pudo guardar: " + error.message };
  revalidatePath("/", "layout");
  return { mensaje: "Configuración guardada." };
}

export async function guardarPlantilla(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/configuracion/plantillas");
  const id = texto(formData, "id");
  const nombre = texto(formData, "nombre");
  if (!nombre) return { error: "Falta el nombre." };
  const meses = Number(texto(formData, "meses_hasta_revision") ?? "6");
  const precio = parsearImporte(formData.get("precio_base"));
  const datos = {
    nombre,
    detalle_sugerido: texto(formData, "detalle_sugerido"),
    meses_hasta_revision: Number.isFinite(meses) && meses >= 0 ? Math.round(meses) : 6,
    precio_base: precio,
    requiere_presupuesto: formData.get("requiere_presupuesto") !== null,
    activo: formData.get("activo") !== null,
    orden: Number(texto(formData, "orden") ?? "0") || 0,
  };
  const supabase = await crearClienteServidor();
  const { error } = id
    ? await supabase.from("tipos_trabajo").update(datos).eq("id", id)
    : await supabase.from("tipos_trabajo").insert(datos);
  if (error) return { error: "No se pudo guardar: " + error.message };
  revalidatePath("/taller/configuracion/plantillas");
  revalidatePath("/taller/ordenes/nueva");
  return { mensaje: id ? "Plantilla guardada." : "Plantilla creada." };
}
