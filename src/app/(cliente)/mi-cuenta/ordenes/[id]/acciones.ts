"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

/** The only state change a client may make: presupuestado -> aprobado (enforced again by RLS + trigger). */
export async function aprobarPresupuesto(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("cliente", "/mi-cuenta/ordenes");
  const id = String(formData.get("id") ?? "");
  const presupuesto = Number(formData.get("presupuesto"));
  if (!id || !Number.isFinite(presupuesto)) return { error: "Falta la orden." };
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("ordenes")
    .update({ estado: "aprobado" }, { count: "exact" })
    .eq("id", id)
    .eq("estado", "presupuestado")
    .eq("presupuesto", presupuesto);
  if (error) return { error: "No se pudo aprobar: " + error.message };
  if (!count)
    return { error: "El presupuesto cambió o la orden ya no está esperando aprobación. Recargá la página." };
  revalidatePath(`/mi-cuenta/ordenes/${id}`);
  revalidatePath("/mi-cuenta");
  revalidatePath("/taller");
  return { mensaje: "Presupuesto aprobado. El taller ya puede empezar." };
}
