"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { ESTADOS_ORDEN, transicionValida, type EstadoOrden } from "@/lib/domain/ordenes";
import { aIsoFecha } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { publicarFoto, subirFotoOrden } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

function refrescar(id: string) {
  revalidatePath(`/taller/ordenes/${id}`);
  revalidatePath("/taller");
  revalidatePath("/taller/ordenes");
  revalidatePath("/taller/cierre");
}

function numero(valor: FormDataEntryValue | null): number | null {
  const v = String(valor ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function cambiarEstado(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  const hacia = String(formData.get("estado") ?? "") as EstadoOrden;
  if (!id || !ESTADOS_ORDEN.includes(hacia)) return { error: "Estado inválido." };

  const supabase = await crearClienteServidor();
  const { data: orden } = await supabase
    .from("ordenes")
    .select("estado, tipos_trabajo(requiere_presupuesto)")
    .eq("id", id)
    .maybeSingle();
  if (!orden) return { error: "No encontramos la orden." };
  if (!transicionValida(orden.estado, hacia, orden.tipos_trabajo?.requiere_presupuesto === false)) {
    return { error: "Ese cambio de estado no está permitido." };
  }
  if (hacia === "listo") redirect(`/taller/ordenes/${id}/cerrar`);

  const { error } = await supabase.from("ordenes").update({ estado: hacia }).eq("id", id);
  if (error) return { error: "No se pudo cambiar: " + error.message };
  refrescar(id);
  return { mensaje: "Estado actualizado." };
}

export async function guardarDetalles(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la orden." };
  const supabase = await crearClienteServidor();

  const cambios: Database["public"]["Tables"]["ordenes"]["Update"] = {};
  if (formData.has("pedido_cliente"))
    cambios.pedido_cliente = String(formData.get("pedido_cliente") ?? "").trim() || null;
  if (formData.has("presupuesto")) cambios.presupuesto = numero(formData.get("presupuesto"));
  if (formData.has("fecha_estimada"))
    cambios.fecha_estimada = String(formData.get("fecha_estimada") ?? "").trim() || null;
  if (formData.has("importe")) cambios.importe = numero(formData.get("importe"));
  if (formData.has("detalle_realizado"))
    cambios.detalle_realizado = String(formData.get("detalle_realizado") ?? "").trim() || null;
  if (formData.has("cuerdas_puestas"))
    cambios.cuerdas_puestas = String(formData.get("cuerdas_puestas") ?? "").trim() || null;
  if (formData.has("proxima_revision"))
    cambios.proxima_revision = String(formData.get("proxima_revision") ?? "").trim() || null;

  if (Object.keys(cambios).length > 0) {
    const { error } = await supabase.from("ordenes").update(cambios).eq("id", id);
    if (error) return { error: "No se pudo guardar: " + error.message };
  }
  if (formData.has("notas")) {
    const texto = String(formData.get("notas") ?? "").trim();
    const { error } = await supabase.from("notas_internas_orden").upsert({ orden_id: id, texto });
    if (error) return { error: "No se pudieron guardar las notas: " + error.message };
  }
  refrescar(id);
  return { mensaje: "Guardado." };
}

export async function agregarFotos(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  const momento = formData.get("momento") === "despues" ? "despues" : "antes";
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!id || fotos.length === 0) return { error: "Elegí al menos una foto." };

  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from("fotos_orden")
    .select("id", { count: "exact", head: true })
    .eq("orden_id", id);
  let orden = count ?? 0;
  for (const foto of fotos) {
    try {
      const ref = await subirFotoOrden(id, momento, foto);
      await supabase.from("fotos_orden").insert({ orden_id: id, url: ref, momento, orden });
      orden += 1;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
  }
  refrescar(id);
  return {
    mensaje: `${fotos.length} foto${fotos.length === 1 ? "" : "s"} agregada${fotos.length === 1 ? "" : "s"}.`,
  };
}

export async function borrarFoto(formData: FormData): Promise<void> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  const fotoId = String(formData.get("foto_id") ?? "");
  if (!id || !fotoId) return;
  const supabase = await crearClienteServidor();
  await supabase.from("fotos_orden").delete().eq("id", fotoId).eq("orden_id", id);
  refrescar(id);
}

/**
 * Close the job: fills in the result, moves to `listo` (the DB trigger recalculates the next
 * revision and schedules the reminder), creates the portfolio piece and sets up the WhatsApp message.
 */
export async function cerrarTrabajo(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la orden." };
  const supabase = await crearClienteServidor();

  const { data: orden } = await supabase
    .from("ordenes")
    .select(
      "id, numero, estado, instrumento_id, tipo_trabajo_id, instrumentos(tipo, marca, modelo), tipos_trabajo(nombre, requiere_presupuesto), fotos_orden(url, momento, orden)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!orden) return { error: "No encontramos la orden." };
  if (orden.estado === "listo" || orden.estado === "entregado")
    return { error: "Esta orden ya está cerrada." };
  if (orden.estado === "cancelado") return { error: "Esta orden está cancelada." };

  const detalle = String(formData.get("detalle_realizado") ?? "").trim() || null;
  const importe = numero(formData.get("importe"));
  const cuerdas = String(formData.get("cuerdas_puestas") ?? "").trim() || null;
  const proxima = String(formData.get("proxima_revision") ?? "").trim() || null;
  const publicar = formData.get("publicar_en_portfolio") !== null;
  const avisar = formData.get("avisar_cliente") !== null;
  const titulo = String(formData.get("titulo_portfolio") ?? "").trim();

  // Photos of the "after" (optional).
  const fotos = formData.getAll("fotos_despues").filter((f): f is File => f instanceof File && f.size > 0);
  let indice = orden.fotos_orden.length;
  const nuevasDespues: string[] = [];
  for (const foto of fotos) {
    try {
      const ref = await subirFotoOrden(id, "despues", foto);
      await supabase
        .from("fotos_orden")
        .insert({ orden_id: id, url: ref, momento: "despues", orden: indice });
      nuevasDespues.push(ref);
      indice += 1;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
  }

  // Walk the state machine up to `listo` (recibido -> en_proceso allowed for templates without quote).
  const salta = orden.tipos_trabajo?.requiere_presupuesto === false;
  const camino: EstadoOrden[] = [];
  let actual: EstadoOrden = orden.estado;
  const pasos: EstadoOrden[] = salta
    ? ["en_proceso", "listo"]
    : ["presupuestado", "aprobado", "en_proceso", "listo"];
  for (const paso of pasos) {
    if (transicionValida(actual, paso, salta) && actual !== paso) {
      camino.push(paso);
      actual = paso;
    }
  }
  if (actual !== "listo") return { error: "No se puede cerrar desde el estado actual." };

  const { error: eDatos } = await supabase
    .from("ordenes")
    .update({
      detalle_realizado: detalle,
      importe,
      cuerdas_puestas: cuerdas,
      proxima_revision: proxima,
      publicar_en_portfolio: publicar,
      avisar_cliente: avisar,
      fecha_cierre: aIsoFecha(hoyArgentina()),
    })
    .eq("id", id);
  if (eDatos) return { error: "No se pudo guardar: " + eDatos.message };

  for (const paso of camino) {
    const { error } = await supabase.from("ordenes").update({ estado: paso }).eq("id", id);
    if (error) return { error: "No se pudo cerrar: " + error.message };
  }

  if (cuerdas) {
    await supabase.from("instrumentos").update({ calibre_cuerdas: cuerdas }).eq("id", orden.instrumento_id);
  }

  if (publicar) {
    const antes =
      orden.fotos_orden.filter((f) => f.momento === "antes").sort((a, b) => a.orden - b.orden)[0]?.url ??
      null;
    const despues =
      nuevasDespues[0] ??
      orden.fotos_orden.filter((f) => f.momento === "despues").sort((a, b) => a.orden - b.orden)[0]?.url ??
      null;
    const [fotoAntes, fotoDespues] = await Promise.all([
      antes ? publicarFoto(antes, `portfolio/${id}/antes`) : Promise.resolve(null),
      despues ? publicarFoto(despues, `portfolio/${id}/despues`) : Promise.resolve(null),
    ]);
    const nombre =
      [orden.instrumentos?.marca, orden.instrumentos?.modelo].filter(Boolean).join(" ") || "Instrumento";
    await supabase.from("trabajos_portfolio").upsert(
      {
        orden_id: id,
        titulo: titulo || `${nombre} — ${orden.tipos_trabajo?.nombre.toLowerCase() ?? "trabajo"}`,
        descripcion: detalle,
        tipo_trabajo_id: orden.tipo_trabajo_id,
        instrumento_tipo: orden.instrumentos?.tipo ?? "otro",
        foto_antes_url: fotoAntes,
        foto_despues_url: fotoDespues,
        visible: true,
      },
      { onConflict: "orden_id" },
    );
    revalidatePath("/");
    revalidatePath("/trabajos");
  }

  refrescar(id);
  const volver = String(formData.get("volver") ?? "");
  redirect(`/taller/ordenes/${id}?cerrada=1${volver === "cierre" ? "&volver=cierre" : ""}`);
}
