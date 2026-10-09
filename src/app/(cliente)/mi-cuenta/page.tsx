import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BarraEstados } from "@/components/cliente/BarraEstados";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { Nota, PuntoSemaforo } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import {
  misInstrumentos,
  obtenerConfiguracionPublicaCliente,
  ordenesEnCurso,
  ultimoTrabajoPorInstrumento,
} from "@/lib/datos/cliente";
import { ETIQUETA_SEMAFORO, diasHasta, semaforo } from "@/lib/domain/revision";
import { fechaDesdeIso, formatearFecha, formatearMesAnio, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { linkWhatsapp } from "@/lib/notificaciones/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mi cuenta" };

export default async function MiCuenta() {
  const sesion = await requerirRol("cliente", "/mi-cuenta");
  const hoy = hoyArgentina();
  const [instrumentos, enCurso, ultimos, config] = await Promise.all([
    misInstrumentos(),
    ordenesEnCurso(),
    ultimoTrabajoPorInstrumento(),
    obtenerConfiguracionPublicaCliente(),
  ]);
  const vencidos = instrumentos.filter((i) => semaforo(fechaDesdeIso(i.proxima_revision), hoy) === "vencida");
  const nombre = sesion.perfil.nombre.split(" ")[0];

  return (
    <Contenido>
      <div>
        <h1 className="h1">Hola, {nombre}</h1>
        <div className="mute">
          {instrumentos.length} instrumento{instrumentos.length === 1 ? "" : "s"} · {enCurso.length} orden
          {enCurso.length === 1 ? "" : "es"} en curso
        </div>
      </div>

      {vencidos.map((i) => {
        const turno = linkWhatsapp(
          config?.whatsapp,
          `Hola! Soy ${sesion.perfil.nombre}. Quiero agendar la revisión de mi ${nombreInstrumento(i)}.`,
        );
        return (
          <div
            key={i.id}
            className="flex flex-col gap-2 rounded-sm border border-red-line border-l-[5px] border-l-red bg-red-bg px-[14px] py-3 text-sm"
          >
            <div>
              <b>Calibración vencida</b> · {nombreInstrumento(i)}, venció el{" "}
              {formatearFecha(i.proxima_revision)}. Con el cambio de estación conviene revisarla.
            </div>
            {turno ? (
              <BotonEnlace href={turno} externo variante="oscuro" tamano="chico" className="self-start">
                Agendar revisión
              </BotonEnlace>
            ) : null}
          </div>
        );
      })}

      <h2 className="h2">Mis instrumentos</h2>
      {instrumentos.length === 0 ? (
        <Nota>Todavía no tenés instrumentos cargados. Cuando dejes uno en el taller, aparece acá.</Nota>
      ) : null}
      <div className="flex flex-col gap-[10px]">
        {instrumentos.map((i) => {
          const estado = semaforo(fechaDesdeIso(i.proxima_revision), hoy);
          const ultimo = ultimos.get(i.id);
          const dias = i.proxima_revision ? diasHasta(hoy, fechaDesdeIso(i.proxima_revision) as Date) : null;
          const texto =
            estado === "vencida"
              ? `Calibración vencida · ${formatearFecha(i.proxima_revision)}`
              : estado === "proxima"
                ? dias === 0
                  ? "Revisión hoy"
                  : `Revisión en ${dias} día${dias === 1 ? "" : "s"}`
                : estado === "al_dia"
                  ? `Al día · próx. ${formatearMesAnio(i.proxima_revision)}`
                  : ETIQUETA_SEMAFORO.sin_fecha;
          return (
            <Link
              key={i.id}
              href={`/mi-cuenta/instrumentos/${i.id}`}
              className="card flex items-center gap-3 p-[10px] no-underline text-ink"
            >
              <Foto url={i.foto_url} alt="" className="size-[60px] shrink-0 text-[10px]" sizes="60px" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="h3">{nombreInstrumento(i)}</span>
                {ultimo ? (
                  <span className="mute">
                    {ultimo.nombre} · {formatearMesAnio(ultimo.fecha)}
                  </span>
                ) : null}
                <PuntoSemaforo estado={estado}>{texto}</PuntoSemaforo>
              </span>
              <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
            </Link>
          );
        })}
      </div>

      {enCurso.map((o) => (
        <Link
          key={o.id}
          href={`/mi-cuenta/ordenes/${o.id}`}
          className="flex flex-col gap-2 rounded-md bg-dark px-4 py-[18px] text-dark-t no-underline"
        >
          <div className="kicker">
            Orden #{String(o.numero).padStart(4, "0")} ·{" "}
            {o.estado === "presupuestado" ? "presupuesto para aprobar" : o.estado.replace("_", " ")}
          </div>
          <div className="font-semibold">
            {o.instrumentos ? nombreInstrumento(o.instrumentos) : "Instrumento"} —{" "}
            {o.tipos_trabajo?.nombre.toLowerCase()}
          </div>
          <BarraEstados estado={o.estado} oscuro />
          {o.fecha_estimada ? (
            <div className="text-[13px] text-[#C9C0B2]">estimado {formatearFecha(o.fecha_estimada)}</div>
          ) : null}
        </Link>
      ))}

      <div className="grid grid-cols-3 gap-[10px]">
        <BotonEnlace href="/mi-cuenta/ordenes" variante="borde" tamano="chico">
          Órdenes
        </BotonEnlace>
        <BotonEnlace href="/mi-cuenta/publicaciones" variante="borde" tamano="chico">
          En venta
        </BotonEnlace>
        <BotonEnlace href="/mi-cuenta/datos" variante="borde" tamano="chico">
          Mis datos
        </BotonEnlace>
      </div>
    </Contenido>
  );
}
