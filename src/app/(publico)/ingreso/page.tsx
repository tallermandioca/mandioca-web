import Image from "next/image";
import { redirect } from "next/navigation";
import { Contenido } from "@/components/layout/Marco";
import { destinoPorRol, destinoSeguro, obtenerSesion } from "@/lib/auth";
import { FormularioIngreso } from "./FormularioIngreso";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ingreso" };

export default async function Ingreso({ searchParams }: PageProps<"/ingreso">) {
  const sesion = await obtenerSesion();
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const volver = destinoSeguro(Array.isArray(sp.volver) ? sp.volver[0] : sp.volver);

  if (sesion) redirect(volver ?? destinoPorRol(sesion.perfil));

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
      {error === "google" ? (
        <div
          role="alert"
          className="rounded-sm border border-red-line border-l-[5px] border-l-red bg-red-bg px-[14px] py-3 text-sm"
        >
          No pudimos iniciar el ingreso con Google. Si el problema sigue, entrá con el link por email.
        </div>
      ) : null}
      {error === "link" ? (
        <div
          role="alert"
          className="rounded-sm border border-red-line border-l-[5px] border-l-red bg-red-bg px-[14px] py-3 text-sm"
        >
          Ese link ya no sirve. Pedí uno nuevo.
        </div>
      ) : null}
      <FormularioIngreso volver={volver} googleHabilitado={process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1"} />
      <div className="mute text-center">
        ¿Primera vez? Entrá con Google o con tu email. El taller después vincula tu cuenta a tus instrumentos.
      </div>
    </Contenido>
  );
}
