import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Nota, Sello } from "@/components/ui/Etiquetas";
import { Foto } from "@/components/ui/Foto";
import { obtenerPublicacion } from "@/lib/datos/publico";
import {
  ETIQUETA_ESTADO_INSTRUMENTO,
  ETIQUETA_TIPO_INSTRUMENTO,
  formatearFecha,
  formatearImporte,
  formatearMesAnio,
} from "@/lib/formato";
import { linkWhatsapp } from "@/lib/notificaciones/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/en-venta/[id]">) {
  const { id } = await params;
  const detalle = await obtenerPublicacion(id);
  return { title: detalle ? detalle.publicacion.titulo : "Publicación" };
}

export default async function DetallePublicacion({ params }: PageProps<"/en-venta/[id]">) {
  const { id } = await params;
  const detalle = await obtenerPublicacion(id);
  if (!detalle) notFound();
  const { publicacion, instrumento, vendedor, historial } = detalle;

  const wa = linkWhatsapp(
    vendedor?.whatsapp,
    `Hola! Vi tu ${publicacion.titulo} en el muestrario del Taller Mandioca y me interesa.`,
  );
  const fotos = publicacion.fotos_publicacion;

  const ficha: [string, string][] = instrumento
    ? [
        ["Tipo", ETIQUETA_TIPO_INSTRUMENTO[instrumento.tipo ?? "otro"] ?? "—"],
        ["Marca / modelo", [instrumento.marca, instrumento.modelo].filter(Boolean).join(" ") || "—"],
        ["Año", instrumento.anio ? String(instrumento.anio) : "—"],
        ["Cuerdas", instrumento.calibre_cuerdas ?? "—"],
        ["Afinación", instrumento.afinacion ?? "—"],
        ["Escala", instrumento.escala ?? "—"],
        [
          "Action (12° traste)",
          instrumento.action_graves_mm !== null && instrumento.action_agudos_mm !== null
            ? `${instrumento.action_graves_mm} / ${instrumento.action_agudos_mm} mm`
            : "—",
        ],
      ]
    : [];

  return (
    <Contenido>
      <Link
        href="/en-venta"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Muestrario
      </Link>
      <Foto
        url={fotos[0]?.url}
        alt={publicacion.titulo}
        marcador={`[FOTO · ${publicacion.titulo}]`}
        className="h-[240px]"
        prioridad
      />
      {fotos.length > 1 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {fotos.slice(1, 5).map((f, i) => (
            <Foto
              key={f.url + i}
              url={f.url}
              alt={`${publicacion.titulo}, foto ${i + 2}`}
              className="aspect-square text-[10px]"
              sizes="120px"
            />
          ))}
        </div>
      ) : null}

      <Sello
        revisadoAt={publicacion.revisado_por_taller ? formatearMesAnio(publicacion.revisado_at) : null}
      />
      <h1 className="h1 text-[30px]">{publicacion.titulo}</h1>
      {publicacion.descripcion ? <p className="lead">{publicacion.descripcion}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <b className="font-display text-[30px] font-bold">
          {formatearImporte(publicacion.precio, publicacion.moneda)}
        </b>
        <span className="mute">{ETIQUETA_ESTADO_INSTRUMENTO[publicacion.estado_instrumento]}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-[13px] text-ink2">
        <span className="rounded-[3px] bg-line2 px-2 py-1">
          {publicacion.con_estuche ? "Con estuche" : "Sin estuche"}
        </span>
        <span className="rounded-[3px] bg-line2 px-2 py-1">
          {publicacion.acepta_permuta ? "Acepta permuta" : "No acepta permuta"}
        </span>
      </div>

      {wa ? (
        <BotonEnlace href={wa} externo>
          Contactar al vendedor por WhatsApp
        </BotonEnlace>
      ) : (
        <Nota>El vendedor todavía no cargó su WhatsApp.</Nota>
      )}
      {vendedor ? (
        <div className="mute">
          Vende: {vendedor.nombre}. El trato es directo entre ustedes, el taller no cobra comisión.
        </div>
      ) : null}

      {ficha.length > 0 ? (
        <section className="card p-[14px]">
          <h2 className="h3 mb-2">Ficha del instrumento</h2>
          <table className="tbl">
            <tbody>
              {ficha.map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {publicacion.mostrar_historial ? (
        <section className="card p-[14px]">
          <h2 className="h3 mb-2">Historial en el taller</h2>
          {historial.length === 0 ? (
            <div className="mute">Sin trabajos registrados.</div>
          ) : (
            <table className="tbl">
              <tbody>
                {historial.map((h) => (
                  <tr key={h.orden_id ?? `${h.fecha_cierre}-${h.tipo_trabajo}`}>
                    <td>{formatearFecha(h.fecha_cierre)}</td>
                    <td>
                      <b>{h.tipo_trabajo}</b>
                      {h.detalle_realizado ? <div className="text-ink2">{h.detalle_realizado}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}
    </Contenido>
  );
}
