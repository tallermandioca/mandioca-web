import { crearClienteServidor } from "@/lib/supabase/server";
import { ESTADOS_ABIERTOS } from "@/lib/domain/ordenes";
import type { Database } from "@/lib/supabase/types";

/** Queries for the workshop panel. Caller must already be an admin (RLS enforces it anyway). */

type Tablas = Database["public"]["Tables"];
export type EstadoOrden = Database["public"]["Enums"]["estado_orden"];
export type TipoInstrumento = Database["public"]["Enums"]["tipo_instrumento"];

export const SELECT_ORDEN_RESUMEN =
  "id, numero, estado, pedido_cliente, fecha_ingreso, fecha_estimada, fecha_cierre, presupuesto, importe, instrumentos(id, tipo, marca, modelo), perfiles!ordenes_cliente_id_fkey(id, nombre, whatsapp), tipos_trabajo(id, nombre)";

export interface OrdenResumen {
  id: string;
  numero: number;
  estado: EstadoOrden;
  pedido_cliente: string | null;
  fecha_ingreso: string;
  fecha_estimada: string | null;
  fecha_cierre: string | null;
  presupuesto: number | null;
  importe: number | null;
  instrumentos: { id: string; tipo: TipoInstrumento; marca: string | null; modelo: string | null } | null;
  perfiles: { id: string; nombre: string; whatsapp: string | null } | null;
  tipos_trabajo: { id: string; nombre: string } | null;
}

export async function ordenesAbiertas(): Promise<OrdenResumen[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("ordenes")
    .select(SELECT_ORDEN_RESUMEN)
    .in("estado", [...ESTADOS_ABIERTOS])
    .order("fecha_ingreso", { ascending: true })
    .order("numero", { ascending: true });
  return (data ?? []) as OrdenResumen[];
}

export async function ordenesPorEstado(estados: EstadoOrden[], limite = 50): Promise<OrdenResumen[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("ordenes")
    .select(SELECT_ORDEN_RESUMEN)
    .in("estado", estados)
    .order("numero", { ascending: false })
    .limit(limite);
  return (data ?? []) as OrdenResumen[];
}

export interface AvisoSemana {
  id: string;
  fecha_programada: string;
  tipo: Database["public"]["Enums"]["tipo_recordatorio"];
  canal: Database["public"]["Enums"]["canal_aviso"];
  estado: Database["public"]["Enums"]["estado_recordatorio"];
  instrumentos: { id: string; tipo: TipoInstrumento; marca: string | null; modelo: string | null } | null;
  perfiles: { id: string; nombre: string; whatsapp: string | null; email: string | null } | null;
}

export const SELECT_AVISO =
  "id, fecha_programada, tipo, canal, estado, instrumentos(id, tipo, marca, modelo), perfiles!recordatorios_cliente_id_fkey(id, nombre, whatsapp, email)";

export async function avisosEntre(desde: string, hasta: string): Promise<AvisoSemana[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("recordatorios")
    .select(SELECT_AVISO)
    .eq("estado", "pendiente")
    .gte("fecha_programada", desde)
    .lte("fecha_programada", hasta)
    .order("fecha_programada");
  return (data ?? []) as AvisoSemana[];
}

export async function todosLosAvisos(): Promise<AvisoSemana[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("recordatorios")
    .select(SELECT_AVISO)
    .in("estado", ["pendiente", "pausado"])
    .order("fecha_programada")
    .limit(200);
  return (data ?? []) as AvisoSemana[];
}

export async function cuentasPendientes(): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from("perfiles")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente")
    .not("user_id", "is", null);
  return count ?? 0;
}

export interface ClienteResumen {
  id: string;
  nombre: string;
  whatsapp: string | null;
  email: string | null;
  estado: Database["public"]["Enums"]["estado_perfil"];
  user_id: string | null;
  instrumentos: {
    id: string;
    tipo: TipoInstrumento;
    marca: string | null;
    modelo: string | null;
    numero_serie: string | null;
  }[];
}

export async function buscarClientes(q: string): Promise<ClienteResumen[]> {
  const supabase = await crearClienteServidor();
  const texto = q.trim();
  let consulta = supabase
    .from("perfiles")
    .select(
      "id, nombre, whatsapp, email, estado, user_id, instrumentos(id, tipo, marca, modelo, numero_serie)",
    )
    .eq("rol", "cliente")
    .order("nombre")
    .limit(60);
  if (texto) {
    const patron = `%${texto.replace(/[%_]/g, "")}%`;
    consulta = consulta.or(`nombre.ilike.${patron},whatsapp.ilike.${patron},email.ilike.${patron}`);
  }
  const { data } = await consulta;
  let clientes = (data ?? []) as ClienteResumen[];

  // Also match by instrument brand/model/serial.
  if (texto) {
    const patron = `%${texto.replace(/[%_]/g, "")}%`;
    const { data: porInstrumento } = await supabase
      .from("instrumentos")
      .select("dueno_id")
      .or(`marca.ilike.${patron},modelo.ilike.${patron},numero_serie.ilike.${patron}`)
      .limit(60);
    const ids = new Set((porInstrumento ?? []).map((i) => i.dueno_id));
    const faltan = [...ids].filter((id) => !clientes.some((c) => c.id === id));
    if (faltan.length > 0) {
      const { data: extra } = await supabase
        .from("perfiles")
        .select(
          "id, nombre, whatsapp, email, estado, user_id, instrumentos(id, tipo, marca, modelo, numero_serie)",
        )
        .in("id", faltan);
      clientes = [...clientes, ...((extra ?? []) as ClienteResumen[])];
    }
  }
  return clientes;
}

export type Instrumento = Tablas["instrumentos"]["Row"];

export async function clienteConTodo(id: string) {
  const supabase = await crearClienteServidor();
  const [{ data: cliente }, { data: instrumentos }, { data: ordenes }] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", id).eq("rol", "cliente").maybeSingle(),
    supabase.from("instrumentos").select("*").eq("dueno_id", id).order("created_at"),
    supabase
      .from("ordenes")
      .select(SELECT_ORDEN_RESUMEN)
      .eq("cliente_id", id)
      .order("numero", { ascending: false }),
  ]);
  if (!cliente) return null;
  return { cliente, instrumentos: instrumentos ?? [], ordenes: (ordenes ?? []) as OrdenResumen[] };
}

export type TipoTrabajo = Tablas["tipos_trabajo"]["Row"];

export async function tiposTrabajo(soloActivos = true): Promise<TipoTrabajo[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase.from("tipos_trabajo").select("*").order("orden").order("nombre");
  if (soloActivos) consulta = consulta.eq("activo", true);
  const { data } = await consulta;
  return data ?? [];
}

export type Configuracion = Tablas["configuracion"]["Row"];

export async function configuracion(): Promise<Configuracion | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("configuracion").select("*").maybeSingle();
  return data;
}

export type OrdenCompleta = Tablas["ordenes"]["Row"] & {
  instrumentos: Instrumento | null;
  perfiles: {
    id: string;
    nombre: string;
    whatsapp: string | null;
    email: string | null;
    canal_preferido: Database["public"]["Enums"]["canal_aviso"];
  } | null;
  tipos_trabajo: TipoTrabajo | null;
  fotos_orden: Tablas["fotos_orden"]["Row"][];
  notas_internas_orden: { texto: string } | null;
};

export async function ordenCompleta(id: string): Promise<OrdenCompleta | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("ordenes")
    .select(
      "*, instrumentos(*), perfiles!ordenes_cliente_id_fkey(id, nombre, whatsapp, email, canal_preferido), tipos_trabajo(*), fotos_orden(*), notas_internas_orden(texto)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const notas = Array.isArray(data.notas_internas_orden)
    ? (data.notas_internas_orden[0] ?? null)
    : data.notas_internas_orden;
  return { ...data, notas_internas_orden: notas } as OrdenCompleta;
}
