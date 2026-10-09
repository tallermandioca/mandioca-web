"use server";

import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { leerDatosCliente, leerDatosInstrumento } from "@/lib/formularios";
import { aIsoFecha } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { subirFotoInstrumento, subirFotoOrden } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResultadoNuevaOrden {
  error?: string;
}

/**
 * Creates the order in one step. Handles a brand-new client and/or instrument inline.
 * Afterwards the order page shows the pre-built WhatsApp message.
 */
export async function crearOrden(_e: ResultadoNuevaOrden, formData: FormData): Promise<ResultadoNuevaOrden> {
  await requerirRol("admin", "/taller/ordenes/nueva");
  const supabase = await crearClienteServidor();

  // 1. Client: existing or new.
  let clienteId = String(formData.get("cliente_id") ?? "");
  if (!clienteId) {
    const datos = leerDatosCliente(formData);
    if (!datos.nombre) return { error: "Elegí un cliente o cargá el nombre del nuevo." };
    if (!datos.whatsapp && !datos.email) return { error: "Cargá el WhatsApp del cliente nuevo." };
    const { data, error } = await supabase
      .from("perfiles")
      .insert({ ...datos, rol: "cliente", estado: "activo" })
      .select("id")
      .single();
    if (error) {
      return {
        error:
          error.code === "23505"
            ? "Ya hay un cliente con ese email. Buscalo arriba."
            : "No se pudo crear el cliente: " + error.message,
      };
    }
    clienteId = data.id;
  }

  // 2. Instrument: existing (must belong to the client) or new.
  let instrumentoId = String(formData.get("instrumento_id") ?? "");
  if (instrumentoId) {
    const { data: inst } = await supabase
      .from("instrumentos")
      .select("id")
      .eq("id", instrumentoId)
      .eq("dueno_id", clienteId)
      .maybeSingle();
    if (!inst) return { error: "Ese instrumento no es de este cliente." };
  } else {
    const datos = leerDatosInstrumento(formData);
    if (!datos.marca && !datos.modelo)
      return { error: "Elegí un instrumento o cargá marca o modelo del nuevo." };
    const { data, error } = await supabase
      .from("instrumentos")
      .insert({ ...datos, dueno_id: clienteId })
      .select("id")
      .single();
    if (error) return { error: "No se pudo crear el instrumento: " + error.message };
    instrumentoId = data.id;
    const fotoSerie = formData.get("foto_serie");
    if (fotoSerie instanceof File && fotoSerie.size > 0) {
      try {
        const ref = await subirFotoInstrumento(instrumentoId, fotoSerie);
        await supabase.from("instrumentos").update({ foto_serie_url: ref }).eq("id", instrumentoId);
      } catch {
        /* the order is more important than the photo; the instrument page allows retrying */
      }
    }
  }

  // 3. Order.
  const tipoTrabajoId = String(formData.get("tipo_trabajo_id") ?? "");
  if (!tipoTrabajoId) return { error: "Elegí el tipo de trabajo." };
  const pedido = String(formData.get("pedido_cliente") ?? "").trim() || null;
  const fechaEstimada = String(formData.get("fecha_estimada") ?? "").trim() || null;
  const avisar = formData.get("avisar_cliente") !== null;

  const { data: orden, error: eOrden } = await supabase
    .from("ordenes")
    .insert({
      instrumento_id: instrumentoId,
      cliente_id: clienteId,
      tipo_trabajo_id: tipoTrabajoId,
      pedido_cliente: pedido,
      fecha_ingreso: aIsoFecha(hoyArgentina()),
      fecha_estimada: fechaEstimada,
      avisar_cliente: avisar,
      estado: "recibido",
    })
    .select("id, numero")
    .single();
  if (eOrden) return { error: "No se pudo crear la orden: " + eOrden.message };

  // 4. "Before" photos (optional).
  const fotos = formData.getAll("fotos_antes").filter((f): f is File => f instanceof File && f.size > 0);
  for (const [i, foto] of fotos.entries()) {
    try {
      const ref = await subirFotoOrden(orden.id, "antes", foto);
      await supabase.from("fotos_orden").insert({ orden_id: orden.id, url: ref, momento: "antes", orden: i });
    } catch {
      /* keep going; photos can be added from the order page */
    }
  }

  redirect(`/taller/ordenes/${orden.id}?creada=1`);
}
