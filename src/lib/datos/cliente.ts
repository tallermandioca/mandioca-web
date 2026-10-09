import { crearClienteServidor } from "@/lib/supabase/server";
import { ESTADOS_ABIERTOS } from "@/lib/domain/ordenes";
import type { Database } from "@/lib/supabase/types";

/** Queries for the client portal. RLS limits everything to the logged-in client's rows. */

type Tablas = Database["public"]["Tables"];
export type Instrumento = Tablas["instrumentos"]["Row"];
export type EstadoOrden = Database["public"]["Enums"]["estado_orden"];

export interface OrdenCliente {
  id: string;
  numero: number;
  estado: EstadoOrden;
  pedido_cliente: string | null;
  presupuesto: number | null;
  presupuesto_aprobado_at: string | null;
  detalle_realizado: string | null;
  importe: number | null;
  cuerdas_puestas: string | null;
  fecha_ingreso: string;
  fecha_estimada: string | null;
  fecha_cierre: string | null;
  proxima_revision: string | null;
  instrumento_id: string;
  instrumentos: {
    id: string;
    tipo: Database["public"]["Enums"]["tipo_instrumento"];
    marca: string | null;
    modelo: string | null;
  } | null;
  tipos_trabajo: { id: string; nombre: string } | null;
  fotos_orden: { id: string; url: string; momento: "antes" | "despues"; orden: number }[];
}

const SELECT_ORDEN =
  "id, numero, estado, pedido_cliente, presupuesto, presupuesto_aprobado_at, detalle_realizado, importe, cuerdas_puestas, fecha_ingreso, fecha_estimada, fecha_cierre, proxima_revision, instrumento_id, instrumentos(id, tipo, marca, modelo), tipos_trabajo(id, nombre), fotos_orden(id, url, momento, orden)";

export async function misInstrumentos(): Promise<Instrumento[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("instrumentos").select("*").order("created_at");
  return data ?? [];
}

export async function misOrdenes(): Promise<OrdenCliente[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("ordenes").select(SELECT_ORDEN).order("numero", { ascending: false });
  return (data ?? []) as OrdenCliente[];
}

export async function ordenesEnCurso(): Promise<OrdenCliente[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("ordenes")
    .select(SELECT_ORDEN)
    .in("estado", [...ESTADOS_ABIERTOS])
    .order("numero", { ascending: false });
  return (data ?? []) as OrdenCliente[];
}

export async function miOrden(id: string): Promise<OrdenCliente | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("ordenes").select(SELECT_ORDEN).eq("id", id).maybeSingle();
  return (data as OrdenCliente | null) ?? null;
}

export async function miInstrumento(
  id: string,
): Promise<{ instrumento: Instrumento; historial: OrdenCliente[] } | null> {
  const supabase = await crearClienteServidor();
  const [{ data: instrumento }, { data: ordenes }] = await Promise.all([
    supabase.from("instrumentos").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("ordenes")
      .select(SELECT_ORDEN)
      .eq("instrumento_id", id)
      .in("estado", ["listo", "entregado"])
      .order("fecha_cierre", { ascending: false }),
  ]);
  if (!instrumento) return null;
  return { instrumento, historial: (ordenes ?? []) as OrdenCliente[] };
}

/** Last closed work per instrument, for the summary list. */
export async function ultimoTrabajoPorInstrumento(): Promise<
  Map<string, { nombre: string; fecha: string | null }>
> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("ordenes")
    .select("instrumento_id, fecha_cierre, tipos_trabajo(nombre)")
    .in("estado", ["listo", "entregado"])
    .order("fecha_cierre", { ascending: false });
  const mapa = new Map<string, { nombre: string; fecha: string | null }>();
  for (const o of data ?? []) {
    if (!mapa.has(o.instrumento_id)) {
      mapa.set(o.instrumento_id, { nombre: o.tipos_trabajo?.nombre ?? "Trabajo", fecha: o.fecha_cierre });
    }
  }
  return mapa;
}

export async function obtenerConfiguracionPublicaCliente() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("configuracion_publica").select("*").maybeSingle();
  return data;
}
