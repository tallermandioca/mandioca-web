import Link from "next/link";
import { Foto } from "@/components/ui/Foto";
import { Sello, Tag } from "@/components/ui/Etiquetas";
import type { Publicacion, TrabajoPortfolio } from "@/lib/datos/publico";
import {
  ETIQUETA_ESTADO_INSTRUMENTO,
  ETIQUETA_TIPO_INSTRUMENTO,
  formatearImporte,
  formatearMesAnio,
} from "@/lib/formato";

export function TarjetaTrabajo({ trabajo }: { trabajo: TrabajoPortfolio }) {
  return (
    <article className="card overflow-hidden">
      <div className="flex h-[150px] overflow-hidden rounded-t-md">
        <Foto
          url={trabajo.foto_antes_url}
          alt={`Antes: ${trabajo.titulo}`}
          marcador="[ANTES]"
          className="flex-1 rounded-none"
        />
        <Foto
          url={trabajo.foto_despues_url}
          alt={`Después: ${trabajo.titulo}`}
          marcador="[DESPUÉS]"
          alterna
          className="flex-1 rounded-none"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-[14px]">
        <div className="flex items-center justify-between gap-3">
          {trabajo.tipos_trabajo ? <Tag>{trabajo.tipos_trabajo.nombre}</Tag> : <span />}
          <span className="mute">{formatearMesAnio(trabajo.fecha)}</span>
        </div>
        <h3 className="h3">{trabajo.titulo}</h3>
        {trabajo.descripcion ? <p className="m-0 text-sm text-ink2">{trabajo.descripcion}</p> : null}
        <div className="mute">{ETIQUETA_TIPO_INSTRUMENTO[trabajo.instrumento_tipo]}</div>
      </div>
    </article>
  );
}

export function TarjetaPublicacion({ publicacion }: { publicacion: Publicacion }) {
  const foto = publicacion.fotos_publicacion[0]?.url ?? null;
  return (
    <article className="card overflow-hidden">
      <Link href={`/en-venta/${publicacion.id}`} className="block no-underline text-inherit">
        <Foto
          url={foto}
          alt={publicacion.titulo}
          marcador={`[FOTO · ${publicacion.titulo}]`}
          className="h-[170px] rounded-none rounded-t-md"
        />
      </Link>
      <div className="flex flex-col gap-1.5 p-[14px]">
        <Sello
          revisadoAt={publicacion.revisado_por_taller ? formatearMesAnio(publicacion.revisado_at) : null}
        />
        <h3 className="h3">
          <Link href={`/en-venta/${publicacion.id}`} className="no-underline text-inherit">
            {publicacion.titulo}
          </Link>
        </h3>
        {publicacion.descripcion ? <p className="m-0 text-sm text-ink2">{publicacion.descripcion}</p> : null}
        <div className="flex items-center justify-between gap-3">
          <b className="font-display text-[26px] font-bold">
            {formatearImporte(publicacion.precio, publicacion.moneda)}
          </b>
          <span className="mute">{ETIQUETA_ESTADO_INSTRUMENTO[publicacion.estado_instrumento]}</span>
        </div>
        <Link
          href={`/en-venta/${publicacion.id}`}
          className="inline-flex min-h-10 items-center justify-center rounded-md border-2 border-ink px-[14px] py-2 text-sm font-bold no-underline text-ink"
        >
          Ver y contactar al vendedor
        </Link>
      </div>
    </article>
  );
}
