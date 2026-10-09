"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResultadoCuenta {
  error?: string;
  mensaje?: string;
}

async function perfilPendiente(id: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("id, user_id, nombre, email, whatsapp, avatar_url, estado")
    .eq("id", id)
    .maybeSingle();
  return { supabase, pendiente: data };
}

/** Approve the self-registered account as a brand new client. */
export async function aprobarComoNuevo(_e: ResultadoCuenta, formData: FormData): Promise<ResultadoCuenta> {
  await requerirRol("admin", "/taller/cuentas");
  const id = String(formData.get("perfil_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  if (!id || !nombre) return { error: "Falta el nombre." };

  const { supabase, pendiente } = await perfilPendiente(id);
  if (!pendiente || pendiente.estado === "activo") return { error: "Esa cuenta ya no está pendiente." };

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, whatsapp, estado: "activo" })
    .eq("id", id);
  if (error) return { error: "No se pudo aprobar: " + error.message };
  revalidatePath("/taller/cuentas");
  return { mensaje: `${nombre} ya puede entrar.` };
}

/** Link the self-registered account to a client the workshop already has. The pending row goes away. */
export async function vincularAExistente(_e: ResultadoCuenta, formData: FormData): Promise<ResultadoCuenta> {
  await requerirRol("admin", "/taller/cuentas");
  const id = String(formData.get("perfil_id") ?? "");
  const existenteId = String(formData.get("existente_id") ?? "");
  if (!id || !existenteId) return { error: "Elegí a qué cliente vincular." };

  const { supabase, pendiente } = await perfilPendiente(id);
  if (!pendiente || !pendiente.user_id || pendiente.estado === "activo") {
    return { error: "Esa cuenta ya no está pendiente." };
  }
  const { data: existente } = await supabase
    .from("perfiles")
    .select("id, nombre, user_id, email")
    .eq("id", existenteId)
    .maybeSingle();
  if (!existente) return { error: "No encontramos ese cliente." };
  if (existente.user_id) return { error: `${existente.nombre} ya tiene una cuenta vinculada.` };

  // Free the user_id first (unique), then attach it to the existing client.
  const userId = pendiente.user_id;
  const { error: e1 } = await supabase.from("perfiles").delete().eq("id", id);
  if (e1) return { error: "No se pudo vincular: " + e1.message };
  const { error: e2 } = await supabase
    .from("perfiles")
    .update({
      user_id: userId,
      estado: "activo",
      email: existente.email ?? pendiente.email,
      avatar_url: pendiente.avatar_url,
    })
    .eq("id", existenteId);
  if (e2) return { error: "No se pudo vincular: " + e2.message };
  revalidatePath("/taller/cuentas");
  revalidatePath("/taller/clientes");
  return { mensaje: `Cuenta vinculada a ${existente.nombre}.` };
}

export async function bloquearCuenta(_e: ResultadoCuenta, formData: FormData): Promise<ResultadoCuenta> {
  await requerirRol("admin", "/taller/cuentas");
  const id = String(formData.get("perfil_id") ?? "");
  const { supabase } = await perfilPendiente(id);
  const { error } = await supabase
    .from("perfiles")
    .update({ estado: "bloqueado" })
    .eq("id", id)
    .neq("rol", "admin");
  if (error) return { error: "No se pudo bloquear: " + error.message };
  revalidatePath("/taller/cuentas");
  return { mensaje: "Cuenta bloqueada." };
}
