import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { EstadoPill } from "@/components/taller/Ordenes";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { misOrdenes } from "@/lib/datos/cliente";
import { ESTADOS_ABIERTOS } from "@/lib/domain/ordenes";
import { formatearFecha, nombreInstrumento } from "@/lib/formato";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis órdenes" };

export default async function MisOrdenes() {
  await requerirRol("cliente", "/mi-cuenta/ordenes");
  const ordenes = await misOrdenes();
  const abiertas = ordenes.filter((o) => ESTADOS_ABIERTOS.includes(o.estado));
  const cerradas = ordenes.filter((o) => !ESTADOS_ABIERTOS.includes(o.estado));

  const Item = ({ o }: { o: (typeof ordenes)[number] }) => (
    <Link
      href={`/mi-cuenta/ordenes/${o.id}`}
      className="card flex items-center gap-3 p-[10px] no-underline text-ink"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="h3 text-[17px]">
          {o.instrumentos ? nombreInstrumento(o.instrumentos) : "Instrumento"} ·{" "}
          {o.tipos_trabajo?.nombre.toLowerCase()}
        </span>
        <span className="mute">
          #{String(o.numero).padStart(4, "0")} ·{" "}
          {o.fecha_cierre
            ? `cerrada el ${formatearFecha(o.fecha_cierre)}`
            : `ingresó el ${formatearFecha(o.fecha_ingreso)}`}
        </span>
      </span>
      <EstadoPill estado={o.estado} paraCliente />
      <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
    </Link>
  );

  return (
    <Contenido>
      <Link
        href="/mi-cuenta"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mi cuenta
      </Link>
      <h1 className="h1 text-[30px]">Mis órdenes</h1>
      {ordenes.length === 0 ? <Nota>Todavía no tenés órdenes.</Nota> : null}
      {abiertas.length > 0 ? <h2 className="h2">En curso</h2> : null}
      <div className="flex flex-col gap-[10px]">
        {abiertas.map((o) => (
          <Item key={o.id} o={o} />
        ))}
      </div>
      {cerradas.length > 0 ? <h2 className="h2">Historial</h2> : null}
      <div className="flex flex-col gap-[10px]">
        {cerradas.map((o) => (
          <Item key={o.id} o={o} />
        ))}
      </div>
    </Contenido>
  );
}
