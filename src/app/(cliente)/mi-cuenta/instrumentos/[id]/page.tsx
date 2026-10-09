import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { Nota, PuntoSemaforo } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { miInstrumento } from "@/lib/datos/cliente";
import { ETIQUETA_SEMAFORO, semaforo } from "@/lib/domain/revision";
import { fechaDesdeIso, formatearFecha, formatearImporte, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { resolverFotos } from "@/lib/storage";
import { FormularioInstrumentoCliente } from "./FormularioInstrumentoCliente";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ficha del instrumento" };

export default async function FichaInstrumento({ params }: PageProps<"/mi-cuenta/instrumentos/[id]">) {
  await requerirRol("cliente", "/mi-cuenta");
  const { id } = await params;
  const datos = await miInstrumento(id);
  if (!datos) notFound();
  const { instrumento: i, historial } = datos;
  const hoy = hoyArgentina();
  const estado = semaforo(fechaDesdeIso(i.proxima_revision), hoy);
  const urls = await resolverFotos(historial.flatMap((o) => o.fotos_orden.map((f) => f.url)));

  const ficha: [string, string][] = [
    ["N° de serie", i.numero_serie ?? "—"],
    ["Cuerdas", i.calibre_cuerdas ?? "—"],
    ["Afinación", i.afinacion ?? "—"],
    [
      "Action (12° traste)",
      i.action_graves_mm !== null && i.action_agudos_mm !== null
        ? `${i.action_graves_mm} / ${i.action_agudos_mm} mm`
        : "—",
    ],
    ["Calibración cada", `${i.calibracion_cada_meses} meses`],
    ["Próxima revisión", i.proxima_revision ? formatearFecha(i.proxima_revision) : "—"],
  ];

  return (
    <Contenido>
      <Link
        href="/mi-cuenta"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mi cuenta
      </Link>
      <div className="kicker">Ficha del instrumento</div>
      <h1 className="h1 text-[32px]">{nombreInstrumento(i)}</h1>
      <Foto
        url={i.foto_url}
        alt={nombreInstrumento(i)}
        marcador={`[FOTO · ${nombreInstrumento(i)}]`}
        className="h-[180px]"
        prioridad
      />
      <PuntoSemaforo estado={estado}>{ETIQUETA_SEMAFORO[estado]}</PuntoSemaforo>
      <div className="card grid grid-cols-2 gap-3 p-[14px]">
        {ficha.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs text-mute">{k}</div>
            <div className="font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <h2 className="h2">Historial de trabajos</h2>
      {historial.length === 0 ? <Nota>Todavía no hay trabajos cerrados en este instrumento.</Nota> : null}
      {historial.map((o) => {
        const fotos = [...o.fotos_orden].sort((a, b) => a.orden - b.orden);
        return (
          <article key={o.id} className="card flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="mute">{formatearFecha(o.fecha_cierre)}</div>
                <div className="font-semibold">{o.tipos_trabajo?.nombre ?? "Trabajo"}</div>
              </div>
              {o.importe !== null ? (
                <div className="font-display text-xl font-bold">{formatearImporte(o.importe)}</div>
              ) : null}
            </div>
            {o.detalle_realizado ? <div className="text-sm text-ink2">{o.detalle_realizado}</div> : null}
            {o.cuerdas_puestas ? <div className="mute">Cuerdas: {o.cuerdas_puestas}</div> : null}
            {fotos.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {fotos.map((f) => (
                  <Foto
                    key={f.id}
                    url={urls.get(f.url) ?? null}
                    alt={f.momento === "antes" ? "Antes" : "Después"}
                    className="aspect-square text-[10px]"
                    sizes="110px"
                  />
                ))}
              </div>
            ) : null}
            <Link
              href={`/mi-cuenta/ordenes/${o.id}`}
              className="text-[13px] font-semibold text-red no-underline"
            >
              Ver orden #{String(o.numero).padStart(4, "0")}
            </Link>
          </article>
        );
      })}

      <div className="flex gap-3">
        <BotonEnlace
          href={`/api/pdf/instrumento/${i.id}`}
          variante="borde"
          tamano="chico"
          className="flex-1"
          externo
        >
          Descargar PDF
        </BotonEnlace>
        <BotonEnlace
          href={`/mi-cuenta/publicar?instrumento=${i.id}`}
          variante="borde"
          tamano="chico"
          className="flex-1"
        >
          Poner en venta
        </BotonEnlace>
      </div>

      <FormularioInstrumentoCliente id={i.id} calibre={i.calibre_cuerdas} />
    </Contenido>
  );
}
