import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { requerirRol } from "@/lib/auth";
import { configuracion } from "@/lib/datos/taller";
import { formatearFechaHora } from "@/lib/formato";
import { instagramConfigurado } from "@/lib/instagram";
import { FormularioConfiguracion } from "./FormularioConfiguracion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configuración" };

const MENSAJES_IG: Record<string, { texto: string; ok: boolean }> = {
  ok: { texto: "Instagram conectado. Los posts ya se muestran en la portada.", ok: true },
  sin_configurar: {
    texto: "Faltan INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET o APP_SECRET_KEY en el servidor.",
    ok: false,
  },
  estado_invalido: { texto: "La conexión expiró o fue interrumpida. Probá de nuevo.", ok: false },
  error_token: {
    texto:
      "Instagram no entregó el token. Revisá que la cuenta sea profesional y esté como tester de la app.",
    ok: false,
  },
  error_guardar: { texto: "No se pudo guardar el token.", ok: false },
  no_admin: { texto: "Solo el taller puede conectar Instagram.", ok: false },
};

export default async function Configuracion({ searchParams }: PageProps<"/taller/configuracion">) {
  await requerirRol("admin", "/taller/configuracion");
  const sp = await searchParams;
  const igParam = Array.isArray(sp.instagram) ? sp.instagram[0] : sp.instagram;
  const mensajeIg = igParam ? MENSAJES_IG[igParam] : undefined;
  const config = await configuracion();
  const igConectado = Boolean(config?.ig_token_encriptado);
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
        <div className="card flex flex-col gap-2 p-3">
          <span className="font-semibold">Instagram</span>
          {mensajeIg ? (
            <span
              className={`rounded-sm px-3 py-2 text-sm ${mensajeIg.ok ? "bg-ok-bg text-ok-t" : "bg-red-bg text-red-d"}`}
            >
              {mensajeIg.texto}
            </span>
          ) : null}
          {igConectado ? (
            <span className="mute">
              Conectado · el token vale hasta el {formatearFechaHora(config?.ig_token_vence_at)} y se renueva
              solo.
            </span>
          ) : (
            <span className="mute">
              Sin conectar. La portada muestra los posts de ejemplo hasta que conectes la cuenta.
            </span>
          )}
          {instagramConfigurado() ? (
            <a
              href="/api/instagram/conectar"
              className="inline-flex min-h-10 w-fit items-center rounded-md border-2 border-ink px-[14px] text-sm font-bold no-underline text-ink"
            >
              {igConectado ? "Volver a conectar" : "Conectar Instagram"}
            </a>
          ) : (
            <span className="mute">
              Para habilitarlo hay que cargar las claves de la app de Meta (ver docs/TRASPASO.md).
            </span>
          )}
        </div>
      </div>
      <div className="card p-3">
        <FormularioConfiguracion config={config} />
      </div>
    </Contenido>
  );
}
