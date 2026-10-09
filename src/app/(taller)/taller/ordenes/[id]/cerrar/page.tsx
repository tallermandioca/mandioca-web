import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { numeroOrden } from "@/components/taller/Ordenes";
import { requerirRol } from "@/lib/auth";
import { ordenCompleta } from "@/lib/datos/taller";
import { calcularProximaRevision } from "@/lib/domain/revision";
import { aIsoFecha, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { FormularioCerrar } from "./FormularioCerrar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cerrar trabajo" };

export default async function CerrarTrabajo({
  params,
  searchParams,
}: PageProps<"/taller/ordenes/[id]/cerrar">) {
  await requerirRol("admin", "/taller/ordenes");
  const { id } = await params;
  const sp = await searchParams;
  const volver = (Array.isArray(sp.volver) ? sp.volver[0] : sp.volver) === "cierre" ? "cierre" : "";
  const orden = await ordenCompleta(id);
  if (!orden) notFound();
  if (orden.estado === "listo" || orden.estado === "entregado" || orden.estado === "cancelado") {
    redirect(`/taller/ordenes/${id}`);
  }

  const hoy = hoyArgentina();
  const meses = orden.tipos_trabajo?.meses_hasta_revision ?? orden.instrumentos?.calibracion_cada_meses ?? 6;
  const proximaSugerida = aIsoFecha(calcularProximaRevision(hoy, meses));
  const instrumento = orden.instrumentos ? nombreInstrumento(orden.instrumentos) : "Instrumento";
  const tieneAntes = orden.fotos_orden.some((f) => f.momento === "antes");
  const tieneDespues = orden.fotos_orden.some((f) => f.momento === "despues");

  return (
    <Contenido className="pb-28">
      <Link
        href={`/taller/ordenes/${orden.id}`}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> {numeroOrden(orden.numero)}
      </Link>
      <div>
        <h1 className="h1 text-[26px]">Cerrar trabajo</h1>
        <div className="mute">
          {numeroOrden(orden.numero)} · {instrumento} · {orden.perfiles?.nombre}
        </div>
      </div>
      <FormularioCerrar
        ordenId={orden.id}
        volver={volver}
        tipoTrabajo={orden.tipos_trabajo?.nombre ?? "Trabajo"}
        detalleInicial={orden.detalle_realizado ?? orden.tipos_trabajo?.detalle_sugerido ?? ""}
        importeInicial={orden.importe ?? orden.presupuesto ?? orden.tipos_trabajo?.precio_base ?? null}
        cuerdasInicial={orden.cuerdas_puestas ?? orden.instrumentos?.calibre_cuerdas ?? ""}
        proximaSugerida={proximaSugerida}
        meses={meses}
        tituloSugerido={`${instrumento} — ${orden.tipos_trabajo?.nombre.toLowerCase() ?? "trabajo"}`}
        publicarInicial={orden.publicar_en_portfolio}
        avisarInicial={orden.avisar_cliente}
        tieneAntes={tieneAntes}
        tieneDespues={tieneDespues}
      />
    </Contenido>
  );
}
