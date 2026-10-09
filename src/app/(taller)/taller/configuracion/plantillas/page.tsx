import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { Pill } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { tiposTrabajo } from "@/lib/datos/taller";
import { formatearImporte } from "@/lib/formato";
import { FormularioPlantilla } from "../FormularioConfiguracion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tipos de trabajo" };

export default async function Plantillas() {
  await requerirRol("admin", "/taller/configuracion/plantillas");
  const tipos = await tiposTrabajo(false);
  return (
    <Contenido>
      <Link
        href="/taller/configuracion"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Configuración
      </Link>
      <h1 className="h1 text-[30px]">Tipos de trabajo</h1>
      <p className="lead">
        Cada tipo precarga el detalle al cerrar y define cuántos meses faltan para la próxima revisión.
      </p>
      {tipos.map((t) => (
        <details key={t.id} className="card p-3">
          <summary className="flex cursor-pointer items-center justify-between gap-2">
            <span>
              <span className="font-semibold">{t.nombre}</span>
              <span className="mute block">
                {t.meses_hasta_revision} meses ·{" "}
                {t.precio_base ? formatearImporte(t.precio_base) : "sin precio base"} ·{" "}
                {t.requiere_presupuesto ? "con presupuesto" : "sin presupuesto"}
              </span>
            </span>
            {!t.activo ? <Pill tono="mute">Inactiva</Pill> : null}
          </summary>
          <div className="pt-3">
            <FormularioPlantilla plantilla={t} />
          </div>
        </details>
      ))}
      <details className="card border-dashed p-3">
        <summary className="cursor-pointer font-semibold">+ Nueva plantilla</summary>
        <div className="pt-3">
          <FormularioPlantilla plantilla={null} />
        </div>
      </details>
    </Contenido>
  );
}
