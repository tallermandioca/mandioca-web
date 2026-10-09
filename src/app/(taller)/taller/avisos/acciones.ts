"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

async function cambiarEstado(formData: FormData, estado: "pendiente" | "pausado" | "cancelado" | "enviado") {
  await requerirRol("admin", "/taller/avisos");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await crearClienteServidor();
  await supabase
    .from("recordatorios")
    .update({ estado, enviado_at: estado === "enviado" ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/taller/avisos");
  revalidatePath("/taller");
}

export async function pausarAviso(formData: FormData): Promise<void> {
  await cambiarEstado(formData, "pausado");
}

export async function reanudarAviso(formData: FormData): Promise<void> {
  await cambiarEstado(formData, "pendiente");
}

export async function cancelarAviso(formData: FormData): Promise<void> {
  await cambiarEstado(formData, "cancelado");
}

/** The workshop tapped the wa.me link: mark as sent. */
export async function marcarEnviado(formData: FormData): Promise<void> {
  await cambiarEstado(formData, "enviado");
}
