import Image from "next/image";
import { redirect } from "next/navigation";
import { Contenido } from "@/components/layout/Marco";
import { destinoPorRol, obtenerSesion } from "@/lib/auth";
import { FormularioIngreso } from "./FormularioIngreso";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ingreso" };

export default async function Ingreso({ searchParams }: PageProps<"/ingreso">) {
  const sesion = await obtenerSesion();
  const sp = await searchParams;
  const volverParam = Array.isArray(sp.volver) ? sp.volver[0] : sp.volver;
  const volver =
    volverParam && volverParam.startsWith("/") && !volverParam.startsWith("//") ? volverParam : null;

  if (sesion) redirect(volver ?? destinoPorRol(sesion.perfil?.rol));

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
