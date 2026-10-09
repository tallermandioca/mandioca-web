import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { ItemOrden } from "@/components/taller/Ordenes";
import { BotonEnlace } from "@/components/ui/Boton";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import {
  avisosEntre,
  cuentasPendientes,
  ordenesAbiertas,
  publicacionesParaAprobar,
} from "@/lib/datos/taller";
import { aIsoFecha, formatearFechaLarga, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina, sumarDias } from "@/lib/hoy";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel del taller" };

const DIA_CORTO = ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."];

export default async function PanelTaller() {
  await requerirRol("admin", "/taller");
  const hoy = hoyArgentina();
  const [abiertas, avisos, pendientes, paraAprobar] = await Promise.all([
    ordenesAbiertas(),
    avisosEntre(aIsoFecha(hoy), aIsoFecha(sumarDias(hoy, 7))),
    cuentasPendientes(),
    publicacionesParaAprobar(),
  ]);
  const paraRetirar = abiertas.filter((o) => o.estado === "listo").length;

  return (
    <Contenido>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1 text-[30px]">Panel del día</h1>
          <div className="mute">{formatearFechaLarga(hoy)}</div>
        </div>
        <Link
          href="/taller/escanear"
          aria-label="Escanear QR"
          className="flex size-11 items-center justify-center rounded-md border-2 border-ink text-ink"
        >
          <QrCode className="size-6" aria-hidden />
        </Link>
      </div>

      <BotonEnlace
        href="/taller/ordenes/nueva"
        className="min-h-14 font-display text-[22px] uppercase tracking-[0.04em]"
      >
        <Plus className="size-6" aria-hidden /> Nueva orden
      </BotonEnlace>

      {pendientes > 0 ? (
        <Link
          href="/taller/cuentas"
          className="flex items-center justify-between rounded-sm border border-red-line border-l-[5px] border-l-red bg-red-bg px-[14px] py-3 text-sm no-underline text-ink"
        >
          <span>
            <b>
              {pendientes} cuenta{pendientes === 1 ? "" : "s"} nueva{pendientes === 1 ? "" : "s"}
            </b>{" "}
            esperando que la{pendientes === 1 ? "" : "s"} vincules
          </span>
          <span className="font-semibold text-red">Ver</span>
        </Link>
      ) : null}

      {paraAprobar > 0 ? (
        <Link
          href="/taller/muestrario"
          className="flex items-center justify-between rounded-sm border border-warn bg-warn-bg px-[14px] py-3 text-sm no-underline text-ink"
        >
          <span>
            <b>
              {paraAprobar} publicaci{paraAprobar === 1 ? "ón" : "ones"}
            </b>{" "}
            esperando aprobación en el muestrario
          </span>
          <span className="font-semibold text-warn-t">Ver</span>
        </Link>
      ) : null}

      <div className="flex gap-2">
        <div className="card flex flex-1 flex-col px-3 py-[10px]">
          <b className="font-display text-[26px] font-extrabold leading-none">{abiertas.length}</b>
          <span className="mute">abiertas</span>
        </div>
        <div className="card flex flex-1 flex-col px-3 py-[10px]">
          <b className="font-display text-[26px] font-extrabold leading-none text-ok-t">{paraRetirar}</b>
          <span className="mute">para retirar</span>
        </div>
        <Link
          href="/taller/avisos"
          className="card flex flex-1 flex-col px-3 py-[10px] no-underline text-ink"
        >
          <b className="font-display text-[26px] font-extrabold leading-none text-warn-t">{avisos.length}</b>
          <span className="mute">avisos esta sem.</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="h2">Órdenes abiertas</h2>
        <Link href="/taller/ordenes" className="text-[13px] font-semibold text-red no-underline">
          Ver todas
        </Link>
      </div>
      {abiertas.length === 0 ? (
        <Nota>No hay órdenes abiertas. Creá una con el botón de arriba.</Nota>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {abiertas.map((o) => (
            <ItemOrden key={o.id} orden={o} hoy={hoy} />
          ))}
        </div>
      )}

      <h2 className="h2">Avisos que salen esta semana</h2>
      <div className="card flex flex-col gap-1.5 px-3 py-[10px] text-sm">
        {avisos.length === 0 ? <span className="mute">Ninguno.</span> : null}
        {avisos.map((a) => {
          const [y, m, d] = a.fecha_programada.split("-").map(Number);
          const fecha = new Date(y, m - 1, d);
          return (
            <Link
              key={a.id}
              href="/taller/avisos"
              className="flex items-center justify-between no-underline text-ink"
            >
              <span>
                {a.perfiles?.nombre ?? "—"} · {a.instrumentos ? nombreInstrumento(a.instrumentos) : "—"} ·{" "}
                {a.tipo === "cuerdas" ? "cuerdas" : a.tipo === "calibracion" ? "calibración" : "aviso"}
              </span>
              <span className="mute">{DIA_CORTO[fecha.getDay()]}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
        <BotonEnlace href="/taller/cierre" variante="borde" tamano="chico">
          Cierre del día
        </BotonEnlace>
        <BotonEnlace href="/taller/configuracion" variante="borde" tamano="chico">
          Configuración
        </BotonEnlace>
      </div>
    </Contenido>
  );
}
