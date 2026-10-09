import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BotonSalir } from "@/components/layout/BotonSalir";
import { Contenido } from "@/components/layout/Marco";
import { requerirRol } from "@/lib/auth";
import { FormularioDatos } from "./FormularioDatos";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis datos" };

export default async function MisDatos() {
  const sesion = await requerirRol("cliente", "/mi-cuenta/datos");
  const p = sesion.perfil;
  return (
    <Contenido>
      <Link
        href="/mi-cuenta"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mi cuenta
      </Link>
      <h1 className="h1 text-[30px]">Mis datos</h1>
      <FormularioDatos
        nombre={p.nombre}
        whatsapp={p.whatsapp}
        email={p.email ?? sesion.email}
        canal={p.canal_preferido}
      />
      <div className="self-start pt-4">
        <BotonSalir tono="claro" />
      </div>
    </Contenido>
  );
}
