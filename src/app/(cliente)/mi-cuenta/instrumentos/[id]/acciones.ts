"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { subirFotoInstrumentoCliente } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

/** The client may change the photo and the string gauge; everything else is the workshop's. */
export async function actualizarMiInstrumento(_e: Resultado, formData: FormData): Promise<Resultado> {
  const sesion = await requerirRol("cliente", "/mi-cuenta");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el instrumento." };
  const supabase = await crearClienteServidor();
  const { data: propio } = await supabase.from("instrumentos").select("id").eq("id", id).maybeSingle();
  if (!propio) return { error: "No encontramos ese instrumento." };

  const cambios: { calibre_cuerdas?: string | null; foto_url?: string } = {};
  if (formData.has("calibre_cuerdas")) {
    cambios.calibre_cuerdas = String(formData.get("calibre_cuerdas") ?? "").trim() || null;
  }
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      cambios.foto_url = await subirFotoInstrumentoCliente(sesion.perfil.id, id, foto);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
  }
  if (Object.keys(cambios).length === 0) return { mensaje: "Sin cambios." };

  const { error, count } = await supabase
    .from("instrumentos")
    .update(cambios, { count: "exact" })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };
  if (!count) return { error: "No encontramos ese instrumento." };
  revalidatePath(`/mi-cuenta/instrumentos/${id}`);
  revalidatePath("/mi-cuenta");
  return { mensaje: "Guardado." };
}
