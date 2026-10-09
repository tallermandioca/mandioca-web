"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { normalizarWhatsapp } from "@/lib/notificaciones/whatsapp";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResultadoCuenta {
  error?: string;
  mensaje?: string;
}

/** Approve the self-registered account as a brand new client. */
export async function aprobarComoNuevo(_e: ResultadoCuenta, formData: FormData): Promise<ResultadoCuenta> {
  await requerirRol("admin", "/taller/cuentas");
  const id = String(formData.get("perfil_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const whatsapp = normalizarWhatsapp(String(formData.get("whatsapp") ?? ""));
  if (!id || !nombre) return { error: "Falta el nombre." };

  const supabase = await crearClienteServidor();
  const { data: pendiente } = await supabase
    .from("perfiles")
    .select("id, estado, email, rol")
    .eq("id", id)
    .maybeSingle();
  if (!pendiente || pendiente.estado !== "pendiente" || pendiente.rol !== "cliente") {
    return { error: "Esa cuenta ya no está pendiente." };
  }
  if (!whatsapp && !pendiente.email) return { error: "Cargá un WhatsApp: la cuenta no tiene email." };

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, whatsapp, estado: "activo" })
    .eq("id", id);
  if (error) return { error: "No se pudo aprobar: " + error.message };
  revalidatePath("/taller/cuentas");
  revalidatePath("/taller");
  return { mensaje: `${nombre} ya puede entrar.` };
}

/** Link the self-registered account to a client the workshop already has (one SQL transaction). */
export async function vincularAExistente(_e: ResultadoCuenta, formData: FormData): Promise<ResultadoCuenta> {
  await requerirRol("admin", "/taller/cuentas");
  const id = String(formData.get("perfil_id") ?? "");
  const existenteId = String(formData.get("existente_id") ?? "");
  if (!id || !existenteId) return { error: "Elegí a qué cliente vincular." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("fn_vincular_cuenta", { pendiente_id: id, existente_id: existenteId });
  if (error) return { error: error.message };
  const { data: existente } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("id", existenteId)
    .maybeSingle();
  revalidatePath("/taller/cuentas");
  revalidatePath("/taller/clientes");
  revalidatePath("/taller");
  return { mensaje: `Cuenta vinculada a ${existente?.nombre ?? "el cliente"}.` };
}

export async function bloquearCuenta(_e: ResultadoCuenta, formData: FormData): Promise<ResultadoCuenta> {
  await requerirRol("admin", "/taller/cuentas");
  const id = String(formData.get("perfil_id") ?? "");
  if (!id) return { error: "Falta la cuenta." };
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("perfiles")
    .update({ estado: "bloqueado" }, { count: "exact" })
    .eq("id", id)
    .eq("rol", "cliente")
    .eq("estado", "pendiente");
  if (error) return { error: "No se pudo bloquear: " + error.message };
  if (!count) return { error: "Esa cuenta ya no está pendiente." };
  revalidatePath("/taller/cuentas");
  revalidatePath("/taller");
  return { mensaje: "Cuenta bloqueada." };
}
