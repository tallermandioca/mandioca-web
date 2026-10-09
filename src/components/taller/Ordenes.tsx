import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Pill } from "@/components/ui/Etiquetas";
import type { EstadoOrden } from "@/lib/domain/ordenes";
import { ETIQUETA_ESTADO } from "@/lib/domain/ordenes";
import type { OrdenResumen } from "@/lib/datos/taller";
import { fechaDesdeIso, formatearFecha, nombreInstrumento } from "@/lib/formato";
import { diasHasta } from "@/lib/domain/revision";

const tonoEstado: Record<EstadoOrden, "ok" | "warn" | "info" | "mute" | "red"> = {
  recibido: "info",
  presupuestado: "mute",
  aprobado: "info",
  en_proceso: "warn",
  listo: "ok",
  entregado: "mute",
  cancelado: "red",
};

export function EstadoPill({ estado, paraCliente = false }: { estado: EstadoOrden; paraCliente?: boolean }) {
  const texto = estado === "recibido" && !paraCliente ? "Presupuestar" : ETIQUETA_ESTADO[estado];
  return <Pill tono={tonoEstado[estado]}>{texto}</Pill>;
}

export function numeroOrden(numero: number): string {
  return `#${String(numero).padStart(4, "0")}`;
}

export function hace(iso: string, hoy: Date): string {
  const fecha = fechaDesdeIso(iso);
  if (!fecha) return "";
  const dias = diasHasta(fecha, hoy);
  if (dias <= 0) return "ingresó hoy";
  if (dias === 1) return "ingresó ayer";
  return `ingresó hace ${dias} días`;
}

export function ItemOrden({ orden, hoy }: { orden: OrdenResumen; hoy: Date }) {
  const titulo = `${orden.instrumentos ? nombreInstrumento(orden.instrumentos) : "Instrumento"} · ${
    orden.tipos_trabajo?.nombre.toLowerCase() ?? "trabajo"
  }`;
  const detalle =
    orden.estado === "presupuestado"
      ? "esperando aprobación"
      : orden.estado === "listo"
        ? `listo el ${formatearFecha(orden.fecha_cierre)}`
        : hace(orden.fecha_ingreso, hoy);
  return (
    <Link
      href={`/taller/ordenes/${orden.id}`}
      className="card flex w-full items-center gap-3 p-[10px] text-left no-underline text-ink"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="h3 text-[17px]">{titulo}</span>
        <span className="mute">
          {numeroOrden(orden.numero)} · {orden.perfiles?.nombre ?? "—"} · {detalle}
        </span>
      </span>
      <EstadoPill estado={orden.estado} />
      <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
    </Link>
  );
}
