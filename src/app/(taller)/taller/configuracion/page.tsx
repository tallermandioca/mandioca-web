import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { requerirRol } from "@/lib/auth";
import { configuracion } from "@/lib/datos/taller";
import { FormularioConfiguracion } from "./FormularioConfiguracion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configuración" };

export default async function Configuracion() {
  await requerirRol("admin", "/taller/configuracion");
  const config = await configuracion();
  return (
    <Contenido>
      <Link
        href="/taller"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Panel
      </Link>
      <h1 className="h1 text-[30px]">Configuración</h1>
      <div className="flex flex-col gap-2">
        <Link
          href="/taller/configuracion/plantillas"
          className="card flex items-center justify-between p-3 no-underline text-ink"
        >
          <span>
            <span className="font-semibold">Tipos de trabajo</span>
            <span className="mute block">
              Plantillas: detalle sugerido, meses hasta revisión, precio base
            </span>
          </span>
          <ChevronRight className="size-5 text-mute" aria-hidden />
        </Link>
        <Link
          href="/taller/configuracion/etiquetas"
          className="card flex items-center justify-between p-3 no-underline text-ink"
        >
          <span>
            <span className="font-semibold">Etiquetas QR</span>
            <span className="mute block">Hoja A4 para imprimir y pegar en los instrumentos</span>
          </span>
          <ChevronRight className="size-5 text-mute" aria-hidden />
        </Link>
        <Link
          href="/taller/cuentas"
          className="card flex items-center justify-between p-3 no-underline text-ink"
        >
          <span>
            <span className="font-semibold">Cuentas nuevas</span>
            <span className="mute block">Clientes que entraron con Google o email y esperan vinculación</span>
          </span>
          <ChevronRight className="size-5 text-mute" aria-hidden />
        </Link>
        <div className="card flex items-center justify-between p-3 text-mute">
          <span>
            <span className="font-semibold">Instagram</span>
            <span className="block">La conexión con Instagram llega en la Fase 6</span>
          </span>
        </div>
      </div>
      <div className="card p-3">
        <FormularioConfiguracion config={config} />
      </div>
    </Contenido>
  );
}
