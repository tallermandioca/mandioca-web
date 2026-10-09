import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { Nota, Pill, Sello } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { miPublicacion } from "@/lib/datos/cliente";
import { formatearMesAnio, nombreInstrumento } from "@/lib/formato";
import { etiquetaPublicacion } from "@/lib/publicaciones";
import { borrarFotoPublicacion } from "../../publicar/acciones";
import { FormularioPublicacion } from "../../publicar/FormularioPublicacion";
import { AccionesPublicacion } from "./AccionesPublicacion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publicación" };

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function DetallePublicacionCliente({
  params,
  searchParams,
}: PageProps<"/mi-cuenta/publicaciones/[id]">) {
  const sesion = await requerirRol("cliente", "/mi-cuenta/publicaciones");
  const { id } = await params;
  const sp = await searchParams;
  const p = await miPublicacion(id, sesion.perfil.id);
  if (!p) notFound();
  const e = etiquetaPublicacion(p);
  const fotos = [...p.fotos_publicacion].sort((a, b) => a.orden - b.orden);

  return (
    <Contenido>
      <Link
        href="/mi-cuenta/publicaciones"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mis publicaciones
      </Link>
      {primero(sp.enviada) ? (
        <div className="rounded-sm bg-ok-bg px-[14px] py-3 text-sm text-ok-t">
          Publicación creada y enviada al taller. Cuando la apruebe, aparece en el muestrario.
        </div>
      ) : null}
      {primero(sp.error) === "fotos" ? (
        <Nota>La publicación se creó pero alguna foto no se pudo subir. Probá de nuevo abajo.</Nota>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="kicker">{p.instrumentos ? nombreInstrumento(p.instrumentos) : "Instrumento"}</div>
          <h1 className="h1 text-[28px]">{p.titulo}</h1>
        </div>
        <Pill tono={e.tono}>{e.texto}</Pill>
      </div>
      <Sello revisadoAt={p.revisado_por_taller ? formatearMesAnio(p.revisado_at) : null} />
      {p.estado === "publicada" ? (
        <BotonEnlace href={`/en-venta/${p.id}`} variante="borde" tamano="chico">
          Ver cómo se ve en el muestrario
        </BotonEnlace>
      ) : null}

      <AccionesPublicacion id={p.id} estado={p.estado} solicitada={p.solicita_publicacion} />

      <section className="card flex flex-col gap-2 p-3">
        <h2 className="h3">Fotos</h2>
        {fotos.length === 0 ? (
          <div className="mute">Sin fotos todavía. Una publicación sin fotos casi no se mira.</div>
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f, i) => (
            <div key={f.id} className="flex flex-col gap-1">
              <Foto url={f.url} alt={`Foto ${i + 1}`} className="aspect-square" sizes="150px" />
              <form action={borrarFotoPublicacion} className="flex justify-between">
                <span className="mute">{i === 0 ? "Portada" : ""}</span>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="foto_id" value={f.id} />
                <button type="submit" className="text-xs font-semibold text-mute">
                  Quitar
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-3">
        <h2 className="h3 mb-2">Datos de la publicación</h2>
        <FormularioPublicacion
          valores={{
            id: p.id,
            titulo: p.titulo,
            descripcion: p.descripcion,
            precio: p.precio,
            estado_instrumento: p.estado_instrumento,
            con_estuche: p.con_estuche,
            acepta_permuta: p.acepta_permuta,
            mostrar_historial: p.mostrar_historial,
            pide_revision: p.pide_revision,
          }}
        />
      </section>
    </Contenido>
  );
}
