"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import type { Configuracion } from "@/lib/datos/taller";
import { guardarPlantilla, guardarConfiguracion, type Resultado } from "./acciones";
import type { TipoTrabajo } from "@/lib/datos/taller";

export function Aviso({ r }: { r: Resultado }) {
  if (r.error) {
    return (
      <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
        {r.error}
      </div>
    );
  }
  if (r.mensaje) {
    return (
      <div role="status" className="rounded-sm bg-ok-bg px-3 py-2 text-sm text-ok-t">
        {r.mensaje}
      </div>
    );
  }
  return null;
}

function sinPlaceholder(v: string | null | undefined): string {
  if (!v || v.startsWith("COMPLETAR")) return "";
  return v;
}

export function FormularioConfiguracion({ config }: { config: Configuracion | null }) {
  const [r, accion, pendiente] = useActionState(guardarConfiguracion, {});
  return (
    <form action={accion} className="flex flex-col gap-[12px]">
      <h2 className="h3">Datos del taller</h2>
      <label className="field">
        Nombre
        <input
          name="nombre_taller"
          defaultValue={config?.nombre_taller ?? "Taller de Instrumentos Mandioca"}
          required
        />
      </label>
      <label className="field">
        WhatsApp del taller
        <input
          name="whatsapp"
          inputMode="tel"
          defaultValue={config?.whatsapp ?? ""}
          placeholder="299 123 4567"
        />
      </label>
      <label className="field">
        Email
        <input type="email" name="email" defaultValue={config?.email ?? ""} />
      </label>
      <label className="field">
        Dirección
        <input
          name="direccion"
          defaultValue={sinPlaceholder(config?.direccion)}
          placeholder="Calle 123, Neuquén"
        />
      </label>
      <label className="field">
        Horario
        <input
          name="horario"
          defaultValue={sinPlaceholder(config?.horario)}
          placeholder="lunes a viernes de 10 a 18 · sábados con turno"
        />
      </label>
      <label className="field">
        Usuario de Instagram
        <input name="instagram_user" defaultValue={config?.instagram_user ?? "mandiocataller"} />
      </label>

      <h2 className="h3 mt-2">Textos de los avisos</h2>
      <div className="mute">
        Podés usar {"{nombre}"}, {"{instrumento}"}, {"{fecha}"}, {"{numero}"} y {"{link}"}.
      </div>
      <label className="field">
        Aviso de calibración
        <textarea
          name="texto_aviso_calibracion"
          rows={3}
          defaultValue={config?.texto_aviso_calibracion ?? ""}
        />
      </label>
      <label className="field">
        Aviso de &quot;listo para retirar&quot;
        <textarea name="texto_aviso_listo" rows={3} defaultValue={config?.texto_aviso_listo ?? ""} />
      </label>

      <h2 className="h3 mt-2">Muestrario</h2>
      <label className="card flex min-h-12 items-center gap-3 p-3">
        <input
          type="checkbox"
          name="moderacion_automatica"
          defaultChecked={config?.moderacion_automatica ?? false}
          className="size-[22px] accent-red"
        />
        <span className="flex flex-col">
          <span className="font-semibold">Publicación automática</span>
          <span className="mute">Si está apagado, cada publicación la aprobás vos antes de que se vea</span>
        </span>
      </label>

      <Aviso r={r} />
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar"}
      </Boton>
    </form>
  );
}

export function FormularioPlantilla({ plantilla }: { plantilla: TipoTrabajo | null }) {
  const [r, accion, pendiente] = useActionState(guardarPlantilla, {});
  return (
    <form action={accion} className="flex flex-col gap-[10px]">
      {plantilla ? <input type="hidden" name="id" value={plantilla.id} /> : null}
      <label className="field">
        Nombre
        <input name="nombre" defaultValue={plantilla?.nombre ?? ""} required placeholder="Calibración" />
      </label>
      <label className="field">
        Detalle sugerido (se precarga al cerrar)
        <textarea name="detalle_sugerido" rows={2} defaultValue={plantilla?.detalle_sugerido ?? ""} />
      </label>
      <div className="grid grid-cols-3 gap-[10px]">
        <label className="field">
          Meses hasta revisión
          <input
            name="meses_hasta_revision"
            inputMode="numeric"
            defaultValue={plantilla?.meses_hasta_revision ?? 6}
          />
        </label>
        <label className="field">
          Precio base ($)
          <input name="precio_base" inputMode="numeric" defaultValue={plantilla?.precio_base ?? ""} />
        </label>
        <label className="field">
          Orden
          <input name="orden" inputMode="numeric" defaultValue={plantilla?.orden ?? 0} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            name="requiere_presupuesto"
            defaultChecked={plantilla?.requiere_presupuesto ?? true}
            className="size-[22px] accent-red"
          />
          Requiere presupuesto
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={plantilla?.activo ?? true}
            className="size-[22px] accent-red"
          />
          Activa
        </label>
      </div>
      <Aviso r={r} />
      <Boton type="submit" variante={plantilla ? "oscuro" : "primario"} tamano="chico" disabled={pendiente}>
        {pendiente ? "Guardando…" : plantilla ? "Guardar" : "Crear plantilla"}
      </Boton>
    </form>
  );
}
