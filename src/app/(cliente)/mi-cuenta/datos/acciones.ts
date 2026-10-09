"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { normalizarWhatsapp } from "@/lib/notificaciones/whatsapp";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

/** Name, WhatsApp and preferred channel. Email is the login identity and stays as is. */
export async function guardarMisDatos(_e: Resultado, formData: FormData): Promise<Resultado> {
  const sesion = await requerirRol("cliente", "/mi-cuenta/datos");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const whatsappTexto = String(formData.get("whatsapp") ?? "").trim();
  const whatsapp = normalizarWhatsapp(whatsappTexto);
  if (whatsappTexto && !whatsapp)
    return { error: "El WhatsApp no parece válido. Probá con el código de área, ej. 299 123 4567." };
  const canal = formData.get("canal_preferido") === "email" ? "email" : "whatsapp";
  if (!nombre) return { error: "Falta tu nombre." };
  if (!whatsapp && !sesion.perfil.email) return { error: "Cargá un WhatsApp." };
  if (canal === "whatsapp" && !whatsapp)
    return { error: "Para recibir avisos por WhatsApp cargá tu número." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, whatsapp, canal_preferido: canal })
    .eq("id", sesion.perfil.id);
  if (error) return { error: "No se pudo guardar: " + error.message };
  revalidatePath("/mi-cuenta", "layout");
  return { mensaje: "Datos guardados." };
}
