"use server";

import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { aIsoFecha } from "@/lib/formato";
import { leerDatosCliente, leerDatosInstrumento } from "@/lib/formularios";
import { hoyArgentina } from "@/lib/hoy";
import { subirFotoInstrumento, subirFotoOrden } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResultadoNuevaOrden {
  error?: string;
}

/**
 * Creates the order in one step, handling a brand-new client and/or instrument inline.
 * Everything is validated before the first insert so a failed attempt leaves no orphan rows.
 */
export async function crearOrden(_e: ResultadoNuevaOrden, formData: FormData): Promise<ResultadoNuevaOrden> {
  await requerirRol("admin", "/taller/ordenes/nueva");
  const supabase = await crearClienteServidor();

  // --- Validate ------------------------------------------------------------
  const clienteId = String(formData.get("cliente_id") ?? "");
  const datosCliente = clienteId ? null : leerDatosCliente(formData);
  if (datosCliente) {
    if (!datosCliente.nombre) return { error: "Elegí un cliente o cargá el nombre del nuevo." };
    if (!datosCliente.whatsapp && !datosCliente.email)
      return { error: "Cargá el WhatsApp del cliente nuevo." };
    if (datosCliente.email) {
      const { data: repetido } = await supabase
        .from("perfiles")
        .select("id")
        .ilike("email", datosCliente.email)
        .maybeSingle();
      if (repetido) return { error: "Ya hay un cliente con ese email. Buscalo arriba." };
    }
  } else {
    const { data: cliente } = await supabase
      .from("perfiles")
      .select("id, estado")
      .eq("id", clienteId)
      .eq("rol", "cliente")
      .maybeSingle();
    if (!cliente) return { error: "No encontramos ese cliente." };
    if (cliente.estado !== "activo")
      return { error: "Ese cliente está pendiente o bloqueado. Vinculalo primero." };
  }

  const instrumentoExistente = clienteId ? String(formData.get("instrumento_id") ?? "") : "";
  const datosInstrumento = instrumentoExistente ? null : leerDatosInstrumento(formData);
  if (instrumentoExistente) {
    const { data: inst } = await supabase
      .from("instrumentos")
      .select("id")
      .eq("id", instrumentoExistente)
      .eq("dueno_id", clienteId)
      .maybeSingle();
    if (!inst) return { error: "Ese instrumento no es de este cliente." };
  } else if (datosInstrumento && !datosInstrumento.marca && !datosInstrumento.modelo) {
    return { error: "Elegí un instrumento o cargá marca o modelo del nuevo." };
  }

  const tipoTrabajoId = String(formData.get("tipo_trabajo_id") ?? "");
  const { data: tipo } = tipoTrabajoId
    ? await supabase
        .from("tipos_trabajo")
        .select("id")
        .eq("id", tipoTrabajoId)
        .eq("activo", true)
        .maybeSingle()
    : { data: null };
  if (!tipo) return { error: "Elegí el tipo de trabajo." };

  const pedido = String(formData.get("pedido_cliente") ?? "").trim() || null;
  const fechaEstimadaRaw = String(formData.get("fecha_estimada") ?? "").trim();
  if (fechaEstimadaRaw && !/^\d{4}-\d{2}-\d{2}$/.test(fechaEstimadaRaw))
    return { error: "La fecha estimada no es válida." };
  const fechaEstimada = fechaEstimadaRaw || null;
  const avisar = formData.get("avisar_cliente") !== null;

  // --- Write ---------------------------------------------------------------
  let clienteFinal = clienteId;
  if (datosCliente) {
    const { data, error } = await supabase
      .from("perfiles")
      .insert({ ...datosCliente, rol: "cliente", estado: "activo" })
      .select("id")
      .single();
    if (error) return { error: "No se pudo crear el cliente: " + error.message };
    clienteFinal = data.id;
  }

  let instrumentoFinal = instrumentoExistente;
  if (datosInstrumento) {
    const { data, error } = await supabase
      .from("instrumentos")
      .insert({ ...datosInstrumento, dueno_id: clienteFinal })
      .select("id")
      .single();
    if (error) return { error: "No se pudo crear el instrumento: " + error.message };
    instrumentoFinal = data.id;
    const fotoSerie = formData.get("foto_serie");
    if (fotoSerie instanceof File && fotoSerie.size > 0) {
      try {
        const ref = await subirFotoInstrumento(instrumentoFinal, fotoSerie);
        await supabase.from("instrumentos").update({ foto_serie_url: ref }).eq("id", instrumentoFinal);
      } catch {
        /* the instrument page allows retrying the photo */
      }
    }
  }

  const { data: orden, error: eOrden } = await supabase
    .from("ordenes")
    .insert({
      instrumento_id: instrumentoFinal,
      cliente_id: clienteFinal,
      tipo_trabajo_id: tipoTrabajoId,
      pedido_cliente: pedido,
      fecha_ingreso: aIsoFecha(hoyArgentina()),
      fecha_estimada: fechaEstimada,
      avisar_cliente: avisar,
      estado: "recibido",
    })
    .select("id")
    .single();
  if (eOrden) return { error: "No se pudo crear la orden: " + eOrden.message };

  const fotos = formData.getAll("fotos_antes").filter((f): f is File => f instanceof File && f.size > 0);
  for (const [i, foto] of fotos.entries()) {
    try {
      const ref = await subirFotoOrden(orden.id, "antes", foto);
      const { error } = await supabase
        .from("fotos_orden")
        .insert({ orden_id: orden.id, url: ref, momento: "antes", orden: i });
      if (error) console.error("fotos_orden insert", error.message);
    } catch (e) {
      console.error("foto antes", e instanceof Error ? e.message : e);
    }
  }

  redirect(`/taller/ordenes/${orden.id}?creada=1`);
}
