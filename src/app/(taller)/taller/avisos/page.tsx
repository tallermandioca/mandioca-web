import { Contenido } from "@/components/layout/Marco";
import { Nota, Pill } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { configuracion, todosLosAvisos } from "@/lib/datos/taller";
import { formatearFecha, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { linkWhatsapp, rellenarPlantilla } from "@/lib/notificaciones/whatsapp";
import { fechaDesdeIso } from "@/lib/formato";
import { cancelarAviso, marcarEnviado, pausarAviso, reanudarAviso } from "./acciones";

export const dynamic = "force-dynamic";

export const metadata = { title: "Avisos" };

const PLANTILLA_POR_DEFECTO =
  "Hola {nombre}! Te escribimos del Taller Mandioca. A tu {instrumento} le toca la revisión (vence el {fecha}). ¿Coordinamos un turno?";

export default async function Avisos() {
  await requerirRol("admin", "/taller/avisos");
  const [avisos, config] = await Promise.all([todosLosAvisos(), configuracion()]);
  const hoy = hoyArgentina();
  const plantilla = config?.texto_aviso_calibracion?.trim() || PLANTILLA_POR_DEFECTO;

  return (
    <Contenido>
      <div className="kicker">Recordatorios</div>
      <h1 className="h1 text-[30px]">Avisos</h1>
      <p className="lead">
        Cada aviso se arma solo al cerrar un trabajo. Tocá &quot;Mandar por WhatsApp&quot;, enviá el mensaje y
        marcalo como enviado.
      </p>
      {avisos.length === 0 ? <Nota>No hay avisos programados.</Nota> : null}
      {avisos.map((a) => {
        const fecha = fechaDesdeIso(a.fecha_programada);
        const vencido = fecha ? fecha.getTime() <= hoy.getTime() : false;
        const instrumento = a.instrumentos ? nombreInstrumento(a.instrumentos) : "instrumento";
        const texto = rellenarPlantilla(plantilla, {
          nombre: a.perfiles?.nombre.split(" ")[0] ?? "",
          instrumento,
          fecha: formatearFecha(a.fecha_programada),
        });
        const wa = linkWhatsapp(a.perfiles?.whatsapp, texto);
        return (
          <article key={a.id} className="card flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold">
                  {a.perfiles?.nombre ?? "—"} · {instrumento}
                </div>
                <div className="mute">
                  {a.tipo === "cuerdas" ? "Cuerdas" : a.tipo === "calibracion" ? "Calibración" : "Aviso"} ·{" "}
                  {formatearFecha(a.fecha_programada)} · por {a.canal === "whatsapp" ? "WhatsApp" : "email"}
                </div>
              </div>
              {a.estado === "pausado" ? (
                <Pill tono="mute">Pausado</Pill>
              ) : vencido ? (
                <Pill tono="warn">Para mandar</Pill>
              ) : (
                <Pill tono="info">Programado</Pill>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-red px-[14px] text-sm font-bold text-white no-underline"
                >
                  Mandar por WhatsApp
                </a>
              ) : (
                <span className="mute self-center">Sin WhatsApp cargado</span>
              )}
              <form action={marcarEnviado}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="min-h-10 rounded-md border-2 border-ink px-3 text-sm font-bold"
                >
                  Marcar enviado
                </button>
              </form>
              {a.estado === "pausado" ? (
                <form action={reanudarAviso}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="min-h-10 px-2 text-sm font-semibold text-ink2">
                    Reanudar
                  </button>
                </form>
              ) : (
                <form action={pausarAviso}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="min-h-10 px-2 text-sm font-semibold text-ink2">
                    Pausar
                  </button>
                </form>
              )}
              <form action={cancelarAviso}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="min-h-10 px-2 text-sm font-semibold text-mute">
                  Cancelar
                </button>
              </form>
            </div>
          </article>
        );
      })}
    </Contenido>
  );
}
