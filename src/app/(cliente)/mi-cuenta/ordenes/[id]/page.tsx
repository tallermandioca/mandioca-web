import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BarraEstados } from "@/components/cliente/BarraEstados";
import { Contenido } from "@/components/layout/Marco";
import { EstadoPill } from "@/components/taller/Ordenes";
import { Foto } from "@/components/ui/Foto";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { miOrden } from "@/lib/datos/cliente";
import { formatearFecha, formatearImporte, nombreInstrumento } from "@/lib/formato";
import { resolverFotos } from "@/lib/storage";
import { BotonAprobar } from "./BotonAprobar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orden" };

export default async function OrdenCliente({ params }: PageProps<"/mi-cuenta/ordenes/[id]">) {
  await requerirRol("cliente", "/mi-cuenta/ordenes");
  const { id } = await params;
  const o = await miOrden(id);
  if (!o) notFound();
  const fotos = [...o.fotos_orden].sort((a, b) => a.orden - b.orden);
  const urls = await resolverFotos(fotos.map((f) => f.url));
  const numero = `#${String(o.numero).padStart(4, "0")}`;

  return (
    <Contenido>
      <Link
        href="/mi-cuenta/ordenes"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mis órdenes
      </Link>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="kicker">Orden {numero}</div>
          <h1 className="h1 text-[28px]">
            {o.instrumentos ? nombreInstrumento(o.instrumentos) : "Instrumento"}
          </h1>
          <div className="mute">
            {o.tipos_trabajo?.nombre ?? "Trabajo"} · ingresó el {formatearFecha(o.fecha_ingreso)}
            {o.fecha_estimada && !o.fecha_cierre ? ` · estimado ${formatearFecha(o.fecha_estimada)}` : ""}
          </div>
        </div>
        <EstadoPill estado={o.estado} />
      </div>

      <div className="card p-3">
        <BarraEstados estado={o.estado} />
      </div>

      {o.estado === "presupuestado" ? (
        o.presupuesto !== null ? (
          <div className="card flex flex-col gap-2 p-3">
            <div className="mute">Presupuesto</div>
            <div className="font-display text-[30px] font-bold">{formatearImporte(o.presupuesto)}</div>
            <BotonAprobar ordenId={o.id} importe={formatearImporte(o.presupuesto)} />
          </div>
        ) : (
          <Nota>El taller está preparando el presupuesto.</Nota>
        )
      ) : null}
      {o.estado === "aprobado" && o.presupuesto !== null ? (
        <div className="card p-3">
          <div className="mute">
            Presupuesto aprobado
            {o.presupuesto_aprobado_at ? ` el ${formatearFecha(o.presupuesto_aprobado_at.slice(0, 10))}` : ""}
          </div>
          <div className="font-display text-xl font-bold">{formatearImporte(o.presupuesto)}</div>
        </div>
      ) : null}
      {o.estado === "listo" ? <Nota>Tu instrumento está listo para retirar en el taller.</Nota> : null}

      {o.pedido_cliente ? (
        <div className="card p-3">
          <div className="mute">Lo que pediste</div>
          <div>{o.pedido_cliente}</div>
        </div>
      ) : null}

      {o.detalle_realizado || o.importe !== null || o.cuerdas_puestas ? (
        <div className="card flex flex-col gap-1 p-3">
          <div className="mute">Qué se hizo</div>
          {o.detalle_realizado ? <div>{o.detalle_realizado}</div> : null}
          {o.cuerdas_puestas ? <div className="mute">Cuerdas: {o.cuerdas_puestas}</div> : null}
          {o.importe !== null ? (
            <div className="font-display text-xl font-bold">{formatearImporte(o.importe)}</div>
          ) : null}
          {o.proxima_revision ? (
            <div className="mute">Próxima revisión: {formatearFecha(o.proxima_revision)}</div>
          ) : null}
        </div>
      ) : null}

      {fotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="flex flex-col gap-1">
              <Foto
                url={urls.get(f.url) ?? null}
                alt={f.momento === "antes" ? "Antes" : "Después"}
                className="aspect-square"
                sizes="150px"
              />
              <span className="mute">{f.momento === "antes" ? "Antes" : "Después"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Contenido>
  );
}
