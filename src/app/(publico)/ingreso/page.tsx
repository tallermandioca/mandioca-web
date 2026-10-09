import Image from "next/image";
import { redirect } from "next/navigation";
import { Contenido } from "@/components/layout/Marco";
import { destinoPorRol, destinoSeguro, obtenerSesion } from "@/lib/auth";
import { Nota } from "@/components/ui/Etiquetas";
import { BotonSalir } from "@/components/layout/BotonSalir";
import { FormularioIngreso } from "./FormularioIngreso";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ingreso" };

export default async function Ingreso({ searchParams }: PageProps<"/ingreso">) {
  const sesion = await obtenerSesion();
  const sp = await searchParams;
  const volver = destinoSeguro(Array.isArray(sp.volver) ? sp.volver[0] : sp.volver);

  if (sesion && sesion.perfil) redirect(volver ?? destinoPorRol(sesion.perfil.rol));
  if (sesion && !sesion.perfil) {
    return (
      <Contenido>
        <div className="h-[30px]" />
        <h1 className="h1">Cuenta sin perfil</h1>
        <Nota>
          Tu usuario existe pero todavía no está vinculado a un perfil del taller. Avisale al taller para que
          lo vincule.
        </Nota>
        <div className="self-start">
          <BotonSalir />
        </div>
      </Contenido>
    );
  }

  return (
    <Contenido>
      <div className="h-[30px]" />
      <Image
        src="/logo-mandioca.png"
        alt=""
        width={110}
        height={110}
        className="size-[110px] self-center rounded-full bg-white"
        priority
      />
      <h1 className="h1 text-center">Mi cuenta</h1>
      <p className="lead text-center">Tus instrumentos, sus trabajos y cuándo toca la próxima revisión.</p>
      <FormularioIngreso volver={volver} />
      <div className="mute text-center">
        ¿Primera vez? La cuenta se crea cuando dejás un instrumento en el taller.
      </div>
    </Contenido>
  );
}
