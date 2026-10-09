"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { parsearImporte } from "@/lib/formato";
import { borrarFotoPublica, subirFotoPublicacionCliente } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export interface Resultado {
  error?: string;
  mensaje?: string;
}

type EstadoInstrumento = Database["public"]["Enums"]["estado_instrumento_venta"];
type EstadoPublicacion = Database["public"]["Enums"]["estado_publicacion"];
const ESTADOS: EstadoInstrumento[] = ["excelente", "muy_bueno", "bueno", "regular"];

function leerDatos(formData: FormData) {
  const estadoRaw = String(formData.get("estado_instrumento") ?? "bueno");
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    precio: parsearImporte(formData.get("precio")),
    estado_instrumento: ESTADOS.includes(estadoRaw as EstadoInstrumento)
      ? (estadoRaw as EstadoInstrumento)
      : "bueno",
    con_estuche: formData.get("con_estuche") !== null,
    acepta_permuta: formData.get("acepta_permuta") !== null,
    mostrar_historial: formData.get("mostrar_historial") !== null,
    pide_revision: formData.get("pide_revision") !== null,
  };
}

function refrescar(id?: string) {
  revalidatePath("/mi-cuenta/publicaciones");
  revalidatePath("/mi-cuenta");
  revalidatePath("/en-venta");
  revalidatePath("/taller/muestrario");
  if (id) revalidatePath(`/mi-cuenta/publicaciones/${id}`);
}

async function subirFotos(
  perfilId: string,
  publicacionId: string,
  formData: FormData,
): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (fotos.length === 0) return null;
  const { count } = await supabase
    .from("fotos_publicacion")
    .select("id", { count: "exact", head: true })
    .eq("publicacion_id", publicacionId);
  let orden = count ?? 0;
  for (const foto of fotos) {
    try {
      const url = await subirFotoPublicacionCliente(perfilId, publicacionId, foto);
      const { error } = await supabase
        .from("fotos_publicacion")
        .insert({ publicacion_id: publicacionId, url, orden });
      if (error) return "No se pudo registrar una foto: " + error.message;
      orden += 1;
    } catch (e) {
      return e instanceof Error ? e.message : "No se pudo subir una foto.";
    }
  }
  return null;
}

/** New draft listing for one of the client's instruments. */
export async function crearPublicacion(_e: Resultado, formData: FormData): Promise<Resultado> {
  const sesion = await requerirRol("cliente", "/mi-cuenta/publicar");
  const instrumentoId = String(formData.get("instrumento_id") ?? "");
  const datos = leerDatos(formData);
  if (!instrumentoId) return { error: "Elegí el instrumento." };
  if (!datos.titulo) return { error: "Poné un título." };
  if (datos.precio === null) return { error: "Poné el precio." };

  const supabase = await crearClienteServidor();
  const { data: instrumento } = await supabase
    .from("instrumentos")
    .select("id, tipo")
    .eq("id", instrumentoId)
    .maybeSingle();
  if (!instrumento) return { error: "Ese instrumento no es tuyo." };
  const precio = datos.precio;
  const { data: existente } = await supabase
    .from("publicaciones_venta")
    .select("id")
    .eq("instrumento_id", instrumentoId)
    .in("estado", ["borrador", "publicada", "pausada"])
    .maybeSingle();
  if (existente) redirect(`/mi-cuenta/publicaciones/${existente.id}`);

  const solicitar = formData.get("solicitar") !== null;
  const { data, error } = await supabase
    .from("publicaciones_venta")
    .insert({
      ...datos,
      precio,
      instrumento_tipo: instrumento.tipo,
      instrumento_id: instrumentoId,
      vendedor_id: sesion.perfil.id,
      estado: "borrador",
      solicita_publicacion: solicitar,
    })
    .select("id")
    .single();
  if (error) return { error: "No se pudo crear: " + error.message };

  const eFotos = await subirFotos(sesion.perfil.id, data.id, formData);
  refrescar(data.id);
  redirect(`/mi-cuenta/publicaciones/${data.id}${eFotos ? "?error=fotos" : solicitar ? "?enviada=1" : ""}`);
}

export async function guardarPublicacion(_e: Resultado, formData: FormData): Promise<Resultado> {
  const sesion = await requerirRol("cliente", "/mi-cuenta/publicaciones");
  const id = String(formData.get("id") ?? "");
  const datos = leerDatos(formData);
  if (!id) return { error: "Falta la publicación." };
  if (!datos.titulo) return { error: "Poné un título." };
  const precio = datos.precio;
  if (precio === null) return { error: "Poné el precio." };

  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("publicaciones_venta")
    .update({ ...datos, precio }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };
  if (!count) return { error: "No encontramos la publicación." };
  const eFotos = await subirFotos(sesion.perfil.id, id, formData);
  refrescar(id);
  return eFotos ? { error: eFotos } : { mensaje: "Guardado." };
}

async function cambiarEstado(
  formData: FormData,
  cambios: Database["public"]["Tables"]["publicaciones_venta"]["Update"],
  desde: EstadoPublicacion[],
) {
  await requerirRol("cliente", "/mi-cuenta/publicaciones");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la publicación." };
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("publicaciones_venta")
    .update(cambios, { count: "exact" })
    .eq("id", id)
    .in("estado", desde);
  if (error) return { error: error.message };
  if (!count) return { error: "La publicación ya no está en ese estado." };
  refrescar(id);
  return {};
}

/** Ask the workshop to publish (or publish directly when automatic moderation is on). */
export async function solicitarPublicacion(_e: Resultado, formData: FormData): Promise<Resultado> {
  const supabase = await crearClienteServidor();
  const { data: config } = await supabase.from("configuracion_publica").select("nombre_taller").maybeSingle();
  void config;
  // Try direct publication first: the trigger rejects it unless moderacion_automatica is on.
  const directo = await cambiarEstado(formData, { estado: "publicada" }, ["borrador", "pausada"]);
  if (!directo.error) return { mensaje: "Publicado. Ya se ve en el muestrario." };
  const pedido = await cambiarEstado(formData, { solicita_publicacion: true }, ["borrador", "pausada"]);
  if (pedido.error) return pedido;
  return { mensaje: "Enviada al taller. Cuando la apruebe, aparece en el muestrario." };
}

export async function pausarPublicacion(_e: Resultado, formData: FormData): Promise<Resultado> {
  const r = await cambiarEstado(formData, { estado: "pausada", solicita_publicacion: false }, [
    "publicada",
    "borrador",
  ]);
  return r.error ? r : { mensaje: "Publicación pausada." };
}

export async function marcarVendida(_e: Resultado, formData: FormData): Promise<Resultado> {
  const r = await cambiarEstado(formData, { estado: "vendida", solicita_publicacion: false }, [
    "publicada",
    "pausada",
    "borrador",
  ]);
  return r.error ? r : { mensaje: "Marcada como vendida. ¡Felicitaciones!" };
}

export async function borrarFotoPublicacion(formData: FormData): Promise<void> {
  await requerirRol("cliente", "/mi-cuenta/publicaciones");
  const id = String(formData.get("id") ?? "");
  const fotoId = String(formData.get("foto_id") ?? "");
  if (!id || !fotoId) return;
  const supabase = await crearClienteServidor();
  const { data: foto } = await supabase
    .from("fotos_publicacion")
    .select("url")
    .eq("id", fotoId)
    .eq("publicacion_id", id)
    .maybeSingle();
  const { count } = await supabase
    .from("fotos_publicacion")
    .delete({ count: "exact" })
    .eq("id", fotoId)
    .eq("publicacion_id", id);
  if (count && foto) await borrarFotoPublica(foto.url);
  refrescar(id);
}
