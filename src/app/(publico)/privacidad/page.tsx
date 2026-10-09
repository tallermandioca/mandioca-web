import { Contenido } from "@/components/layout/Marco";
import { SITIO } from "@/config/sitio";
import { obtenerConfiguracionPublica } from "@/lib/datos/publico";

export const dynamic = "force-dynamic";

export const metadata = { title: "Privacidad" };

export default async function Privacidad() {
  const config = await obtenerConfiguracionPublica();
  const nombre = config?.nombre_taller ?? SITIO.nombre;
  const contacto = config?.email ?? `Instagram @${config?.instagram_user ?? SITIO.instagramUser}`;
  return (
    <Contenido>
      <div className="kicker">Legales</div>
      <h1 className="h1 text-[30px]">Política de privacidad</h1>
      <p className="lead">Qué datos guarda {nombre} y para qué.</p>
      <div className="card flex flex-col gap-3 p-4 text-sm leading-relaxed text-ink2">
        <p>
          <b className="text-ink">Qué guardamos.</b> Tu nombre, un medio de contacto (WhatsApp o email) y los
          datos de los instrumentos que dejás en el taller: ficha técnica, trabajos realizados, fotos del
          antes y el después, presupuestos e importes.
        </p>
        <p>
          <b className="text-ink">Para qué.</b> Para llevar el historial de cada instrumento, avisarte cuando
          le toca una revisión o cuando un trabajo está listo, y para que puedas ver todo desde tu cuenta.
        </p>
        <p>
          <b className="text-ink">Ingreso con Google o por email.</b> Usamos tu email solo para identificarte.
          No publicamos nada en tu nombre ni accedemos a tus contactos.
        </p>
        <p>
          <b className="text-ink">Qué es público.</b> La galería de trabajos muestra fotos del instrumento sin
          tu nombre ni número de serie. Si publicás un instrumento en venta, se muestra lo que vos cargás, tu
          nombre de pila y tu WhatsApp para que te contacten. Lo podés pausar o retirar cuando quieras.
        </p>
        <p>
          <b className="text-ink">Con quién se comparte.</b> Con nadie. Los datos viven en nuestros
          proveedores de infraestructura (Supabase, Vercel, Resend) solo para que el sistema funcione. No
          vendemos ni cedemos datos.
        </p>
        <p>
          <b className="text-ink">Tus derechos.</b> Podés pedir ver, corregir o borrar tus datos cuando
          quieras escribiéndonos a {contacto}.
        </p>
      </div>
    </Contenido>
  );
}
