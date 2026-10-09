"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { Pill, Sello } from "@/components/ui/Etiquetas";
import {
  aprobarPublicacion,
  destacarPublicacion,
  marcarSello,
  pausarPublicacionTaller,
  quitarSello,
  type Resultado,
} from "./acciones";

export interface OrdenParaSello {
  id: string;
  numero: number;
  fecha: string;
  tipo: string;
  valida: boolean;
}

export interface PublicacionModeracion {
  id: string;
  titulo: string;
  precio: string;
  estado: string;
  solicita_publicacion: boolean;
  destacada: boolean;
  revisado_por_taller: boolean;
  revisado_at: string | null;
  pide_revision: boolean;
  vendedor: string;
  instrumento: string;
  foto: string | null;
  etiqueta: { texto: string; tono: "ok" | "mute" | "warn" | "info" };
  ordenes: OrdenParaSello[];
}

function Aviso({ r }: { r: Resultado }) {
  if (r.error)
    return (
      <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
        {r.error}
      </div>
    );
  if (r.mensaje)
    return (
      <div role="status" className="rounded-sm bg-ok-bg px-3 py-2 text-sm text-ok-t">
        {r.mensaje}
      </div>
    );
  return null;
}

export function TarjetaModeracion({ p }: { p: PublicacionModeracion }) {
  const [rAp, accionAp, pAp] = useActionState(aprobarPublicacion, {} as Resultado);
  const [rPa, accionPa, pPa] = useActionState(pausarPublicacionTaller, {} as Resultado);
  const [rDe, accionDe, pDe] = useActionState(destacarPublicacion, {} as Resultado);
  const [rSe, accionSe, pSe] = useActionState(marcarSello, {} as Resultado);
  const [rQu, accionQu, pQu] = useActionState(quitarSello, {} as Resultado);
  const hidden = <input type="hidden" name="id" value={p.id} />;
  const ultimo = [rAp, rPa, rDe, rSe, rQu].find((r) => r.error || r.mensaje) ?? {};
  const validas = p.ordenes.filter((o) => o.valida);

  return (
    <article className="card flex flex-col gap-2 p-3">
      <div className="flex items-start gap-3">
        <Foto url={p.foto} alt="" className="size-16 shrink-0 text-[10px]" sizes="64px" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold">{p.titulo}</span>
            <Pill tono={p.etiqueta.tono}>{p.etiqueta.texto}</Pill>
          </div>
          <span className="mute">
            {p.vendedor} · {p.instrumento} · {p.precio}
            {p.destacada ? " · destacada" : ""}
          </span>
          <Sello revisadoAt={p.revisado_por_taller ? (p.revisado_at ?? "") : null} />
          {p.pide_revision && !p.revisado_por_taller ? (
            <span className="text-sm text-warn-t">El cliente pide la revisión del taller.</span>
          ) : null}
        </div>
      </div>
      <Aviso r={ultimo} />
      <div className="flex flex-wrap gap-2">
        {p.estado !== "publicada" && p.estado !== "vendida" ? (
          <form action={accionAp}>
            {hidden}
            <Boton type="submit" tamano="chico" disabled={pAp}>
              {pAp ? "…" : p.solicita_publicacion ? "Aprobar y publicar" : "Publicar"}
            </Boton>
          </form>
        ) : null}
        {p.estado === "publicada" ? (
          <form action={accionPa}>
            {hidden}
            <Boton type="submit" variante="borde" tamano="chico" disabled={pPa}>
              Pausar
            </Boton>
          </form>
        ) : null}
        {p.estado === "publicada" ? (
          <form action={accionDe}>
            {hidden}
            <input type="hidden" name="destacada" value={p.destacada ? "0" : "1"} />
            <Boton type="submit" variante="borde" tamano="chico" disabled={pDe}>
              {p.destacada ? "Quitar destacado" : "Destacar"}
            </Boton>
          </form>
        ) : null}
        {p.estado === "publicada" ? (
          <Link
            href={`/en-venta/${p.id}`}
            className="inline-flex min-h-10 items-center px-2 text-sm font-semibold text-ink2 no-underline"
          >
            Ver pública
          </Link>
        ) : null}
      </div>

      {p.estado !== "vendida" ? (
        p.revisado_por_taller ? (
          <form action={accionQu} className="flex">
            {hidden}
            <button type="submit" disabled={pQu} className="min-h-10 text-[13px] font-semibold text-mute">
              Quitar sello
            </button>
          </form>
        ) : (
          <form
            action={accionSe}
            className="flex flex-col gap-2 rounded-sm border border-dashed border-line p-2"
          >
            {hidden}
            <div className="text-sm font-semibold">Sello &quot;Revisado por el taller&quot;</div>
            {validas.length === 0 ? (
              <div className="mute">
                Necesita una orden cerrada de este instrumento en los últimos 6 meses.
                {p.ordenes.length > 0 ? " Las que hay son más viejas." : " No hay ninguna."}
              </div>
            ) : (
              <>
                <select
                  name="orden_id"
                  defaultValue={validas[0].id}
                  className="min-h-10 rounded-sm border border-line bg-card px-2 text-sm"
                >
                  {validas.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{String(o.numero).padStart(4, "0")} · {o.tipo} · {o.fecha}
                    </option>
                  ))}
                </select>
                <Boton type="submit" variante="oscuro" tamano="chico" disabled={pSe}>
                  {pSe ? "…" : "Poner el sello"}
                </Boton>
              </>
            )}
          </form>
        )
      ) : null}
    </article>
  );
}
