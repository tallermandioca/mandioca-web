"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth";
import { puedeMarcarSello } from "@/lib/domain/sello";
import { aIsoFecha, fechaDesdeIso } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

function refrescar() {
  revalidatePath("/taller/muestrario");
  revalidatePath("/taller");
  revalidatePath("/en-venta");
  revalidatePath("/");
}

async function actualizar(
  formData: FormData,
  cambios: Database["public"]["Tables"]["publicaciones_venta"]["Update"],
): Promise<Resultado> {
  await requerirRol("admin", "/taller/muestrario");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la publicación." };
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("publicaciones_venta")
    .update(cambios, { count: "exact" })
    .eq("id", id);
  if (error) return { error: error.message };
  if (!count) return { error: "No encontramos la publicación." };
  refrescar();
  return {};
}

export async function aprobarPublicacion(_e: Resultado, formData: FormData): Promise<Resultado> {
  const r = await actualizar(formData, { estado: "publicada", solicita_publicacion: false });
  return r.error ? r : { mensaje: "Publicada." };
}

export async function pausarPublicacionTaller(_e: Resultado, formData: FormData): Promise<Resultado> {
  const r = await actualizar(formData, { estado: "pausada", solicita_publicacion: false });
  return r.error
    ? r
    : { mensaje: "Pausada. El cliente la ve como pausada y puede pedir publicarla de nuevo." };
}

export async function destacarPublicacion(_e: Resultado, formData: FormData): Promise<Resultado> {
  const destacada = formData.get("destacada") === "1";
  const r = await actualizar(formData, { destacada });
  return r.error ? r : { mensaje: destacada ? "Destacada." : "Ya no está destacada." };
}

/** Workshop seal: needs a closed order of the same instrument within the last six months. */
export async function marcarSello(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/muestrario");
  const id = String(formData.get("id") ?? "");
  const ordenId = String(formData.get("orden_id") ?? "");
  if (!id || !ordenId) return { error: "Elegí la orden de revisión." };
  const supabase = await crearClienteServidor();
  const [{ data: pub }, { data: orden }] = await Promise.all([
    supabase.from("publicaciones_venta").select("instrumento_id").eq("id", id).maybeSingle(),
    supabase
      .from("ordenes")
      .select("id, instrumento_id, estado, fecha_cierre")
      .eq("id", ordenId)
      .maybeSingle(),
  ]);
  if (!pub || !orden) return { error: "No encontramos la publicación o la orden." };
  if (orden.instrumento_id !== pub.instrumento_id) return { error: "Esa orden es de otro instrumento." };
  if (
    !puedeMarcarSello(
      { estado: orden.estado, fecha_cierre: fechaDesdeIso(orden.fecha_cierre) },
      hoyArgentina(),
    )
  ) {
    return { error: "El sello necesita una orden cerrada en los últimos 6 meses." };
  }
  const { error } = await supabase
    .from("publicaciones_venta")
    .update({
      revisado_por_taller: true,
      revision_orden_id: orden.id,
      revisado_at: orden.fecha_cierre ?? aIsoFecha(hoyArgentina()),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  refrescar();
  return { mensaje: "Sello puesto." };
}

export async function quitarSello(_e: Resultado, formData: FormData): Promise<Resultado> {
  const r = await actualizar(formData, {
    revisado_por_taller: false,
    revision_orden_id: null,
    revisado_at: null,
  });
  return r.error ? r : { mensaje: "Sello quitado." };
}
