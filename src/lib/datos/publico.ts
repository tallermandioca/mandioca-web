import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/** Read-only queries for the public site. All go through RLS as anon/user. */

type Tablas = Database["public"]["Tables"];
type Vistas = Database["public"]["Views"];

export type TrabajoPortfolio = Pick<
  Tablas["trabajos_portfolio"]["Row"],
  | "id"
  | "titulo"
  | "descripcion"
  | "instrumento_tipo"
  | "foto_antes_url"
  | "foto_despues_url"
  | "fecha"
  | "destacado"
> & { tipos_trabajo: { id: string; nombre: string } | null };

export type Publicacion = Pick<
  Tablas["publicaciones_venta"]["Row"],
  | "id"
  | "titulo"
  | "descripcion"
  | "precio"
  | "moneda"
  | "estado_instrumento"
  | "con_estuche"
  | "acepta_permuta"
  | "revisado_por_taller"
  | "revisado_at"
  | "mostrar_historial"
  | "created_at"
> & { fotos_publicacion: { url: string; orden: number }[] };

export type ConfiguracionPublica = Vistas["configuracion_publica"]["Row"];
export type PostInstagram = Pick<
  Tablas["instagram_posts"]["Row"],
  "id" | "ig_id" | "tipo" | "media_url" | "thumbnail_url" | "permalink" | "caption"
>;

export const TAMANO_PAGINA = 12;

export async function obtenerConfiguracionPublica(): Promise<ConfiguracionPublica | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("configuracion_publica").select("*").maybeSingle();
  return data;
}

export async function obtenerTiposTrabajoPublicos(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  // Only types that have at least one visible portfolio piece.
  const { data } = await supabase
    .from("trabajos_portfolio")
    .select("tipos_trabajo(id, nombre)")
    .eq("visible", true);
  const vistos = new Map<string, string>();
  for (const fila of data ?? []) {
    if (fila.tipos_trabajo) vistos.set(fila.tipos_trabajo.id, fila.tipos_trabajo.nombre);
  }
  return [...vistos.entries()]
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export interface FiltrosTrabajos {
  tipoId?: string;
  instrumento?: Database["public"]["Enums"]["tipo_instrumento"];
  pagina?: number;
}

export async function listarTrabajos(
  filtros: FiltrosTrabajos = {},
): Promise<{ trabajos: TrabajoPortfolio[]; total: number }> {
  const supabase = await crearClienteServidor();
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const desde = (pagina - 1) * TAMANO_PAGINA;
  let consulta = supabase
    .from("trabajos_portfolio")
    .select(
      "id, titulo, descripcion, instrumento_tipo, foto_antes_url, foto_despues_url, fecha, destacado, tipos_trabajo(id, nombre)",
      {
        count: "exact",
      },
    )
    .eq("visible", true)
    .order("fecha", { ascending: false })
    .range(desde, desde + TAMANO_PAGINA - 1);
  if (filtros.tipoId) consulta = consulta.eq("tipo_trabajo_id", filtros.tipoId);
  if (filtros.instrumento) consulta = consulta.eq("instrumento_tipo", filtros.instrumento);
  const { data, count } = await consulta;
  return { trabajos: data ?? [], total: count ?? 0 };
}

export async function ultimosTrabajos(cantidad: number): Promise<TrabajoPortfolio[]> {
  const { trabajos } = await listarTrabajos({ pagina: 1 });
  return trabajos.slice(0, cantidad);
}

export interface FiltrosVenta {
  tipo?: Database["public"]["Enums"]["tipo_instrumento"];
  precioMin?: number;
  precioMax?: number;
  revisado?: boolean;
  estuche?: boolean;
  permuta?: boolean;
  orden?: "fecha" | "precio_asc" | "precio_desc";
}

export async function listarPublicaciones(filtros: FiltrosVenta = {}): Promise<Publicacion[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("publicaciones_venta")
    .select(
      "id, titulo, descripcion, precio, moneda, estado_instrumento, con_estuche, acepta_permuta, revisado_por_taller, revisado_at, mostrar_historial, created_at, fotos_publicacion(url, orden), instrumentos!inner(tipo)",
    )
    .eq("estado", "publicada");
  if (filtros.tipo) consulta = consulta.eq("instrumentos.tipo", filtros.tipo);
  if (filtros.precioMin !== undefined) consulta = consulta.gte("precio", filtros.precioMin);
  if (filtros.precioMax !== undefined) consulta = consulta.lte("precio", filtros.precioMax);
  if (filtros.revisado) consulta = consulta.eq("revisado_por_taller", true);
  if (filtros.estuche) consulta = consulta.eq("con_estuche", true);
  if (filtros.permuta) consulta = consulta.eq("acepta_permuta", true);
  switch (filtros.orden) {
    case "precio_asc":
      consulta = consulta.order("precio", { ascending: true });
      break;
    case "precio_desc":
      consulta = consulta.order("precio", { ascending: false });
      break;
    default:
      consulta = consulta.order("destacada", { ascending: false }).order("created_at", { ascending: false });
  }
  const { data } = await consulta;
  return (data ?? []).map((p) => ({
    ...p,
    fotos_publicacion: [...p.fotos_publicacion].sort((a, b) => a.orden - b.orden),
  }));
}

export interface DetallePublicacion {
  publicacion: Publicacion;
  instrumento: Vistas["instrumentos_publicos"]["Row"] | null;
  vendedor: Vistas["vendedores_publicos"]["Row"] | null;
  historial: Vistas["historial_publico"]["Row"][];
}

export async function obtenerPublicacion(id: string): Promise<DetallePublicacion | null> {
  const supabase = await crearClienteServidor();
  const { data: publicacion } = await supabase
    .from("publicaciones_venta")
    .select(
      "id, titulo, descripcion, precio, moneda, estado_instrumento, con_estuche, acepta_permuta, revisado_por_taller, revisado_at, mostrar_historial, created_at, fotos_publicacion(url, orden)",
    )
    .eq("id", id)
    .eq("estado", "publicada")
    .maybeSingle();
  if (!publicacion) return null;

  const [instrumento, vendedor, historial] = await Promise.all([
    supabase.from("instrumentos_publicos").select("*").eq("publicacion_id", id).maybeSingle(),
    supabase.from("vendedores_publicos").select("*").eq("publicacion_id", id).maybeSingle(),
    supabase
      .from("historial_publico")
      .select("*")
      .eq("publicacion_id", id)
      .order("fecha_cierre", { ascending: false }),
  ]);

  return {
    publicacion: {
      ...publicacion,
      fotos_publicacion: [...publicacion.fotos_publicacion].sort((a, b) => a.orden - b.orden),
    },
    instrumento: instrumento.data,
    vendedor: vendedor.data,
    historial: historial.data ?? [],
  };
}

export async function ultimosPostsInstagram(cantidad: number): Promise<PostInstagram[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("instagram_posts")
    .select("id, ig_id, tipo, media_url, thumbnail_url, permalink, caption")
    .order("fecha", { ascending: false })
    .limit(cantidad);
  return data ?? [];
}
