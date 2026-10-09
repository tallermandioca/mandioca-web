"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { ESTADOS_ORDEN, transicionValida, type EstadoOrden } from "@/lib/domain/ordenes";
import { aIsoFecha, parsearImporte } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { publicarFoto, subirFotoOrden } from "@/lib/storage";
import { notificarOrdenPorEmail } from "@/lib/notificaciones/ordenes";
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

function fechaValida(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

/** Shortest sequence of states from `desde` to `listo`, or null when unreachable. */
function caminoHastaListo(desde: EstadoOrden, saltaPresupuesto: boolean): EstadoOrden[] | null {
  const previos = new Map<EstadoOrden, EstadoOrden | null>([[desde, null]]);
  const cola: EstadoOrden[] = [desde];
  while (cola.length > 0) {
    const actual = cola.shift() as EstadoOrden;
    if (actual === "listo") {
      const camino: EstadoOrden[] = [];
      let paso: EstadoOrden | null = actual;
      while (paso && paso !== desde) {
        camino.unshift(paso);
        paso = previos.get(paso) ?? null;
      }
      return camino;
    }
    for (const siguiente of ESTADOS_ORDEN) {
      if (siguiente === "cancelado" || previos.has(siguiente)) continue;
      if (transicionValida(actual, siguiente, saltaPresupuesto)) {
        previos.set(siguiente, actual);
        cola.push(siguiente);
      }
    }
  }
  return null;
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
  if (hacia === "presupuestado") {
    const { data: completa } = await supabase
      .from("ordenes")
      .select(
        "numero, presupuesto, avisar_cliente, instrumentos(tipo, marca, modelo), perfiles!ordenes_cliente_id_fkey(nombre, email, whatsapp, canal_preferido)",
      )
      .eq("id", id)
      .maybeSingle();
    if (completa) await notificarOrdenPorEmail(completa, "presupuesto");
  }
  refrescar(id);
  return { mensaje: "Estado actualizado." };
}

export async function guardarDetalles(_e: Resultado, formData: FormData): Promise<Resultado> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la orden." };
  const supabase = await crearClienteServidor();

  const texto = (clave: string) => String(formData.get(clave) ?? "").trim() || null;
  const cambios: Database["public"]["Tables"]["ordenes"]["Update"] = {};
  if (formData.has("pedido_cliente")) cambios.pedido_cliente = texto("pedido_cliente");
  if (formData.has("presupuesto")) cambios.presupuesto = parsearImporte(formData.get("presupuesto"));
  if (formData.has("importe")) cambios.importe = parsearImporte(formData.get("importe"));
  if (formData.has("detalle_realizado")) cambios.detalle_realizado = texto("detalle_realizado");
  if (formData.has("cuerdas_puestas")) cambios.cuerdas_puestas = texto("cuerdas_puestas");
  for (const campo of ["fecha_estimada", "proxima_revision"] as const) {
    if (!formData.has(campo)) continue;
    const valor = texto(campo);
    if (valor && !fechaValida(valor)) return { error: "La fecha no es válida." };
    cambios[campo] = valor;
  }

  if (Object.keys(cambios).length > 0) {
    const { error } = await supabase.from("ordenes").update(cambios).eq("id", id);
    if (error) return { error: "No se pudo guardar: " + error.message };
  }
  if (formData.has("notas")) {
    const notas = String(formData.get("notas") ?? "").trim();
    const { error } = await supabase.from("notas_internas_orden").upsert({ orden_id: id, texto: notas });
    if (error) return { error: "No se pudieron guardar las notas: " + error.message };
  }
  refrescar(id);
  return { mensaje: "Guardado." };
}

async function guardarFotos(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  ordenId: string,
  momento: "antes" | "despues",
  fotos: File[],
  desde: number,
): Promise<{ refs: string[]; error?: string }> {
  const refs: string[] = [];
  let orden = desde;
  for (const foto of fotos) {
    let ref: string;
    try {
      ref = await subirFotoOrden(ordenId, momento, foto);
    } catch (e) {
      return { refs, error: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
    const { error } = await supabase
      .from("fotos_orden")
      .insert({ orden_id: ordenId, url: ref, momento, orden });
    if (error) return { refs, error: "No se pudo registrar la foto: " + error.message };
    refs.push(ref);
    orden += 1;
  }
  return { refs };
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
  const { refs, error } = await guardarFotos(supabase, id, momento, fotos, count ?? 0);
  refrescar(id);
  if (error) return { error: refs.length > 0 ? `${error} (se guardaron ${refs.length})` : error };
  return {
    mensaje: `${refs.length} foto${refs.length === 1 ? "" : "s"} agregada${refs.length === 1 ? "" : "s"}.`,
  };
}

export async function borrarFoto(formData: FormData): Promise<void> {
  await requerirRol("admin", "/taller/ordenes");
  const id = String(formData.get("id") ?? "");
  const fotoId = String(formData.get("foto_id") ?? "");
  if (!id || !fotoId) return;
  const supabase = await crearClienteServidor();
  const { data: foto } = await supabase
    .from("fotos_orden")
    .select("url")
    .eq("id", fotoId)
    .eq("orden_id", id)
    .maybeSingle();
  await supabase.from("fotos_orden").delete().eq("id", fotoId).eq("orden_id", id);
  if (foto?.url.startsWith("fotos-privadas:")) {
    await supabase.storage.from("fotos-privadas").remove([foto.url.slice("fotos-privadas:".length)]);
  }
  refrescar(id);
}

/**
 * Close the job: validates, uploads the "after" photos, fills in the result, walks the state
 * machine to `listo` (the DB trigger recalculates the next revision and schedules the reminder)
 * and, when both photos exist, publishes the portfolio piece.
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

  const salta = orden.tipos_trabajo?.requiere_presupuesto === false;
  const camino = caminoHastaListo(orden.estado, salta);
  if (!camino) return { error: "No se puede cerrar desde el estado actual." };

  const detalle = String(formData.get("detalle_realizado") ?? "").trim() || null;
  const importe = parsearImporte(formData.get("importe"));
  const cuerdas = String(formData.get("cuerdas_puestas") ?? "").trim() || null;
  const proxima = String(formData.get("proxima_revision") ?? "").trim() || null;
  if (proxima && !fechaValida(proxima)) return { error: "La fecha de próxima revisión no es válida." };
  const publicar = formData.get("publicar_en_portfolio") !== null;
  const avisar = formData.get("avisar_cliente") !== null;
  const titulo = String(formData.get("titulo_portfolio") ?? "").trim();

  // "After" photos (optional), only now that everything else is valid.
  const fotos = formData.getAll("fotos_despues").filter((f): f is File => f instanceof File && f.size > 0);
  const { refs: nuevasDespues, error: eFotos } = await guardarFotos(
    supabase,
    id,
    "despues",
    fotos,
    orden.fotos_orden.length,
  );
  if (eFotos) {
    refrescar(id);
    return { error: `${eFotos}. Las fotos que sí subieron quedaron en la orden; volvé a intentar.` };
  }

  // Result data first (while the state is still open, so the close trigger reads the chosen date).
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
    if (error) {
      refrescar(id);
      return { error: `No se pudo cerrar (quedó en "${paso}"): ${error.message}` };
    }
  }

  if (cuerdas) {
    await supabase.from("instrumentos").update({ calibre_cuerdas: cuerdas }).eq("id", orden.instrumento_id);
  }

  if (avisar) {
    const [{ data: completa }, { data: config }] = await Promise.all([
      supabase
        .from("ordenes")
        .select(
          "numero, presupuesto, avisar_cliente, instrumentos(tipo, marca, modelo), perfiles!ordenes_cliente_id_fkey(nombre, email, whatsapp, canal_preferido)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("configuracion").select("texto_aviso_listo").maybeSingle(),
    ]);
    if (completa) await notificarOrdenPorEmail(completa, "listo", config?.texto_aviso_listo);
  }

  let avisoPortfolio = "";
  if (publicar) {
    const porOrden = (a: { orden: number }, b: { orden: number }) => a.orden - b.orden;
    const antes = orden.fotos_orden.filter((f) => f.momento === "antes").sort(porOrden)[0]?.url ?? null;
    const despues =
      nuevasDespues[0] ??
      orden.fotos_orden.filter((f) => f.momento === "despues").sort(porOrden)[0]?.url ??
      null;
    if (!antes || !despues) {
      avisoPortfolio = "sinfotos";
    } else {
      const [fotoAntes, fotoDespues] = await Promise.all([
        publicarFoto(antes, `portfolio/${id}/antes`),
        publicarFoto(despues, `portfolio/${id}/despues`),
      ]);
      if (!fotoAntes || !fotoDespues) {
        avisoPortfolio = "errorfotos";
      } else {
        const nombre =
          [orden.instrumentos?.marca, orden.instrumentos?.modelo].filter(Boolean).join(" ") || "Instrumento";
        const { error } = await supabase.from("trabajos_portfolio").upsert(
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
        if (error) avisoPortfolio = "errorportfolio";
        revalidatePath("/");
        revalidatePath("/trabajos");
      }
    }
  }

  refrescar(id);
  const volver = String(formData.get("volver") ?? "");
  const params = new URLSearchParams({ cerrada: String(orden.numero) });
  if (avisoPortfolio) params.set("portfolio", avisoPortfolio);
  if (volver === "cierre") redirect(`/taller/cierre?${params.toString()}`);
  redirect(`/taller/ordenes/${id}?${params.toString()}`);
}
