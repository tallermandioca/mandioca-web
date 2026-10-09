import Image from "next/image";
import { redirect } from "next/navigation";
import { BotonSalir } from "@/components/layout/BotonSalir";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Nota } from "@/components/ui/Etiquetas";
import { destinoPorRol, obtenerSesion } from "@/lib/auth";
import { obtenerConfiguracionPublica } from "@/lib/datos/publico";
import { linkWhatsapp } from "@/lib/notificaciones/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cuenta pendiente" };

/** Landing for a logged-in user whose profile the workshop has not approved yet. */
export default async function CuentaPendiente() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/ingreso");
  if (sesion.perfil?.estado === "activo") redirect(destinoPorRol(sesion.perfil));

  const config = await obtenerConfiguracionPublica();
  const bloqueada = sesion.perfil?.estado === "bloqueado";
  const email = sesion.email ?? sesion.perfil?.email ?? "";
  const wa = linkWhatsapp(
    config?.whatsapp,
    `Hola! Me registré en el portal del taller con el email ${email}. ¿Me vinculás la cuenta a mis instrumentos?`,
  );

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
      {bloqueada ? (
        <>
          <h1 className="h1 text-center">Cuenta bloqueada</h1>
          <p className="lead text-center">
            Esta cuenta no tiene acceso al portal. Si creés que es un error, hablá con el taller.
          </p>
        </>
      ) : (
        <>
          <h1 className="h1 text-center">Ya casi</h1>
          <p className="lead text-center">
            Tu cuenta está creada con <b>{email}</b>. Falta que el taller la vincule a tus instrumentos.
          </p>
          <Nota>
            El taller revisa las cuentas nuevas y las conecta con la ficha de cada cliente. Si querés
            apurarlo, avisale por WhatsApp.
          </Nota>
          {wa ? (
            <BotonEnlace href={wa} externo>
              Avisar al taller por WhatsApp
            </BotonEnlace>
          ) : null}
        </>
      )}
      <BotonEnlace href="/" variante="borde">
        Volver al sitio
      </BotonEnlace>
      <div className="self-center">
        <BotonSalir tono="claro" />
      </div>
    </Contenido>
  );
}
