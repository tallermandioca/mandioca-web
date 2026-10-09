import { Contenido } from "@/components/layout/Marco";
import { Chip, Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { puedeMarcarSello } from "@/lib/domain/sello";
import {
  fechaDesdeIso,
  formatearFecha,
  formatearImporte,
  formatearMesAnio,
  nombreInstrumento,
} from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { etiquetaPublicacion } from "@/lib/publicaciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import { TarjetaModeracion, type PublicacionModeracion } from "./TarjetaModeracion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Muestrario" };

const FILTROS = [
  { clave: "pendientes", texto: "Para aprobar" },
  { clave: "publicadas", texto: "Publicadas" },
  { clave: "otras", texto: "Borradores y pausadas" },
  { clave: "vendidas", texto: "Vendidas" },
] as const;

export default async function MuestrarioTaller({ searchParams }: PageProps<"/taller/muestrario">) {
  await requerirRol("admin", "/taller/muestrario");
  const sp = await searchParams;
  const filtroParam = Array.isArray(sp.filtro) ? sp.filtro[0] : sp.filtro;
  const filtro = FILTROS.some((f) => f.clave === filtroParam)
    ? (filtroParam as (typeof FILTROS)[number]["clave"])
    : "pendientes";
  const hoy = hoyArgentina();

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("publicaciones_venta")
    .select(
      "id, titulo, precio, moneda, estado, solicita_publicacion, destacada, revisado_por_taller, revisado_at, pide_revision, instrumento_id, perfiles!publicaciones_venta_vendedor_id_fkey(nombre), instrumentos(tipo, marca, modelo), fotos_publicacion(url, orden)",
    )
    .order("created_at", { ascending: false });
  const todas = data ?? [];
  const pendientes = todas.filter((p) => p.solicita_publicacion && p.estado !== "publicada");
  const lista =
    filtro === "pendientes"
      ? pendientes
      : filtro === "publicadas"
        ? todas.filter((p) => p.estado === "publicada")
        : filtro === "vendidas"
          ? todas.filter((p) => p.estado === "vendida")
          : todas.filter(
              (p) => p.estado !== "publicada" && p.estado !== "vendida" && !p.solicita_publicacion,
            );

  // Closed orders per instrument, for the seal.
  const instrumentoIds = [...new Set(lista.map((p) => p.instrumento_id))];
  const { data: ordenes } =
    instrumentoIds.length > 0
      ? await supabase
          .from("ordenes")
          .select("id, numero, instrumento_id, estado, fecha_cierre, tipos_trabajo(nombre)")
          .in("instrumento_id", instrumentoIds)
          .in("estado", ["listo", "entregado"])
          .order("fecha_cierre", { ascending: false })
      : { data: [] };

  const tarjetas: PublicacionModeracion[] = lista.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    precio: formatearImporte(p.precio, p.moneda),
    estado: p.estado,
    solicita_publicacion: p.solicita_publicacion,
    destacada: p.destacada,
    revisado_por_taller: p.revisado_por_taller,
    revisado_at: p.revisado_at ? formatearMesAnio(p.revisado_at) : null,
    pide_revision: p.pide_revision,
    vendedor: p.perfiles?.nombre ?? "—",
    instrumento: p.instrumentos ? nombreInstrumento(p.instrumentos) : "—",
    foto: [...p.fotos_publicacion].sort((a, b) => a.orden - b.orden)[0]?.url ?? null,
    etiqueta: etiquetaPublicacion(p),
    ordenes: (ordenes ?? [])
      .filter((o) => o.instrumento_id === p.instrumento_id)
      .map((o) => ({
        id: o.id,
        numero: o.numero,
        fecha: formatearFecha(o.fecha_cierre),
        tipo: o.tipos_trabajo?.nombre ?? "Trabajo",
        valida: puedeMarcarSello({ estado: o.estado, fecha_cierre: fechaDesdeIso(o.fecha_cierre) }, hoy),
      })),
  }));

  return (
    <Contenido>
      <h1 className="h1 text-[30px]">Muestrario</h1>
      <p className="lead">
        Publicaciones de los clientes. Vos aprobás, pausás, destacás y ponés el sello de revisión.
      </p>
      <div className="chips">
        {FILTROS.map((f) => (
          <Chip key={f.clave} href={`/taller/muestrario?filtro=${f.clave}`} activo={filtro === f.clave}>
            {f.texto}
            {f.clave === "pendientes" && pendientes.length > 0 ? ` (${pendientes.length})` : ""}
          </Chip>
        ))}
      </div>
      {tarjetas.length === 0 ? <Nota>No hay publicaciones en esta lista.</Nota> : null}
      {tarjetas.map((p) => (
        <TarjetaModeracion key={p.id} p={p} />
      ))}
    </Contenido>
  );
}
