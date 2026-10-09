"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { subirFotoInstrumento } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import { leerDatosCliente, leerDatosInstrumento } from "@/lib/formularios";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

export async function crearCliente(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/clientes/nuevo");
  const datos = leerDatosCliente(formData);
  if (!datos.nombre) return { error: "Falta el nombre." };
  if (!datos.whatsapp && !datos.email) return { error: "Cargá un WhatsApp o un email." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .insert({ ...datos, rol: "cliente", estado: "activo" })
    .select("id")
    .single();
  if (error) {
    return {
      error:
        error.code === "23505" ? "Ya hay un cliente con ese email." : "No se pudo crear: " + error.message,
    };
  }
  revalidatePath("/taller/clientes");
  redirect(`/taller/clientes/${data.id}`);
}

export async function editarCliente(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/clientes");
  const id = String(formData.get("id") ?? "");
  const datos = leerDatosCliente(formData);
  if (!id || !datos.nombre) return { error: "Falta el nombre." };
  if (!datos.whatsapp && !datos.email) return { error: "Cargá un WhatsApp o un email." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update(datos).eq("id", id).eq("rol", "cliente");
  if (error) {
    return {
      error:
        error.code === "23505" ? "Ya hay un cliente con ese email." : "No se pudo guardar: " + error.message,
    };
  }
  revalidatePath(`/taller/clientes/${id}`);
  return { mensaje: "Datos guardados." };
}

export async function crearInstrumento(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/clientes");
  const duenoId = String(formData.get("dueno_id") ?? "");
  const datos = leerDatosInstrumento(formData);
  if (!duenoId) return { error: "Falta el cliente." };
  if (!datos.marca && !datos.modelo) return { error: "Cargá al menos marca o modelo." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("instrumentos")
    .insert({ ...datos, dueno_id: duenoId })
    .select("id")
    .single();
  if (error) return { error: "No se pudo crear: " + error.message };

  const foto = formData.get("foto_serie");
  if (foto instanceof File && foto.size > 0) {
    try {
      const ref = await subirFotoInstrumento(data.id, foto);
      await supabase.from("instrumentos").update({ foto_serie_url: ref }).eq("id", data.id);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
  }
  revalidatePath(`/taller/clientes/${duenoId}`);
  redirect(`/taller/clientes/${duenoId}`);
}

export async function editarInstrumento(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/clientes");
  const id = String(formData.get("id") ?? "");
  const datos = leerDatosInstrumento(formData);
  if (!id) return { error: "Falta el instrumento." };
  const proxima = String(formData.get("proxima_revision") ?? "").trim() || null;

  const supabase = await crearClienteServidor();
  const { data: actual } = await supabase.from("instrumentos").select("dueno_id").eq("id", id).maybeSingle();
  if (!actual) return { error: "No encontramos el instrumento." };
  const { error } = await supabase
    .from("instrumentos")
    .update({ ...datos, proxima_revision: proxima })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };

  const foto = formData.get("foto_serie");
  if (foto instanceof File && foto.size > 0) {
    try {
      const ref = await subirFotoInstrumento(id, foto);
      await supabase.from("instrumentos").update({ foto_serie_url: ref }).eq("id", id);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
  }
  revalidatePath(`/taller/clientes/${actual.dueno_id}`);
  revalidatePath(`/taller/instrumentos/${id}`);
  return { mensaje: "Instrumento guardado." };
}
