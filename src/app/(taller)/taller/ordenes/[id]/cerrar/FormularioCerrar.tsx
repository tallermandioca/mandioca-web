"use client";

import { useActionState, useState } from "react";
import { CamaraFotos } from "@/components/taller/CamaraFotos";
import { Dictado } from "@/components/taller/Dictado";
import { Boton } from "@/components/ui/Boton";
import { formatearFecha } from "@/lib/formato";
import { cerrarTrabajo } from "../acciones";

interface Props {
  ordenId: string;
  volver: string;
  tipoTrabajo: string;
  detalleInicial: string;
  importeInicial: number | null;
  cuerdasInicial: string;
  proximaSugerida: string;
  meses: number;
  tituloSugerido: string;
  publicarInicial: boolean;
  avisarInicial: boolean;
  tieneAntes: boolean;
  tieneDespues: boolean;
}

export function FormularioCerrar(p: Props) {
  const [r, accion, pendiente] = useActionState(cerrarTrabajo, {});
  const [cambiarFecha, setCambiarFecha] = useState(false);
  const [publicar, setPublicar] = useState(p.publicarInicial);

  return (
    <form action={accion} className="flex flex-col gap-[14px]">
      <input type="hidden" name="id" value={p.ordenId} />
      {p.volver ? <input type="hidden" name="volver" value={p.volver} /> : null}
      <div className="card flex items-center justify-between px-3 py-2">
        <span className="font-semibold">{p.tipoTrabajo}</span>
        <span className="mute">plantilla cargada · tocá lo que cambia</span>
      </div>
      <Dictado name="detalle_realizado" etiqueta="Qué se hizo" defaultValue={p.detalleInicial} rows={3} />
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field">
          Importe ($, opcional)
          <input name="importe" inputMode="numeric" defaultValue={p.importeInicial ?? ""} />
        </label>
        <label className="field">
          Cuerdas puestas
          <input name="cuerdas_puestas" defaultValue={p.cuerdasInicial} />
        </label>
      </div>

      <div className="card flex items-center justify-between gap-2 px-3 py-2">
        <div>
          <div className="mute">Próxima revisión</div>
          {cambiarFecha ? (
            <input
              type="date"
              name="proxima_revision"
              defaultValue={p.proximaSugerida}
              className="mt-1 rounded-sm border border-line px-2 py-1"
            />
          ) : (
            <>
              <div className="font-semibold">
                En {p.meses} meses · {formatearFecha(p.proximaSugerida)}
              </div>
              <input type="hidden" name="proxima_revision" value={p.proximaSugerida} />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCambiarFecha((v) => !v)}
          className="text-[13px] font-semibold text-red"
        >
          {cambiarFecha ? "Usar sugerida" : "Cambiar"}
        </button>
      </div>

      <CamaraFotos
        name="fotos_despues"
        etiqueta={p.tieneDespues ? "Más fotos del después" : "Foto del después"}
      />

      <label className="card flex min-h-12 items-center gap-3 p-3">
        <input
          type="checkbox"
          name="publicar_en_portfolio"
          checked={publicar}
          onChange={(e) => setPublicar(e.target.checked)}
          className="size-[22px] accent-red"
        />
        <span className="flex flex-col">
          <span className="font-semibold">Mostrar en Trabajos</span>
          <span className="mute">usa las fotos de antes y después, sin datos del cliente</span>
        </span>
      </label>
      {publicar ? (
        <>
          <label className="field">
            Título para la galería
            <input name="titulo_portfolio" defaultValue={p.tituloSugerido} />
          </label>
          {!p.tieneAntes ? (
            <div className="mute">
              Esta orden no tiene foto del antes: se publica solo con la del después.
            </div>
          ) : null}
        </>
      ) : null}

      <label className="card flex min-h-12 items-center gap-3 p-3">
        <input
          type="checkbox"
          name="avisar_cliente"
          defaultChecked={p.avisarInicial}
          className="size-[22px] accent-red"
        />
        <span className="flex flex-col">
          <span className="font-semibold">Avisar al cliente</span>
          <span className="mute">
            &quot;Está listo para retirar&quot; por WhatsApp, con un toque al terminar
          </span>
        </span>
      </label>

      {r.error ? (
        <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
          {r.error}
        </div>
      ) : null}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-10 mx-auto flex w-full max-w-[480px] gap-2 border-t border-line bg-card px-[18px] py-3">
        <Boton type="submit" className="flex-1" disabled={pendiente}>
          {pendiente ? "Cerrando…" : "Cerrar trabajo"}
        </Boton>
      </div>
    </form>
  );
}
