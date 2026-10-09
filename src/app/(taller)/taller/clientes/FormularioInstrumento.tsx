"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { ETIQUETA_TIPO_INSTRUMENTO } from "@/lib/formato";
import { crearInstrumento, editarInstrumento } from "./acciones";
import { Aviso } from "./FormularioCliente";

export interface ValoresInstrumento {
  id?: string;
  dueno_id?: string;
  tipo?: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  numero_serie?: string | null;
  calibre_cuerdas?: string | null;
  afinacion?: string | null;
  escala?: string | null;
  trastes_cantidad?: number | null;
  trastes_material?: string | null;
  action_graves_mm?: number | null;
  action_agudos_mm?: number | null;
  calibracion_cada_meses?: number | null;
  proxima_revision?: string | null;
}

const TIPOS = ["electrica", "acustica", "criolla", "bajo", "otro"];

export function FormularioInstrumento({
  valores = {},
  compacto = false,
}: {
  valores?: ValoresInstrumento;
  compacto?: boolean;
}) {
  const editando = Boolean(valores.id);
  const [r, accion, pendiente] = useActionState(editando ? editarInstrumento : crearInstrumento, {});
  return (
    <form action={accion} className="flex flex-col gap-[12px]">
      {valores.id ? <input type="hidden" name="id" value={valores.id} /> : null}
      {valores.dueno_id ? <input type="hidden" name="dueno_id" value={valores.dueno_id} /> : null}
      <label className="field">
        Tipo
        <select name="tipo" defaultValue={valores.tipo ?? "electrica"}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_TIPO_INSTRUMENTO[t]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field">
          Marca
          <input name="marca" defaultValue={valores.marca ?? ""} placeholder="Fender" />
        </label>
        <label className="field">
          Modelo
          <input name="modelo" defaultValue={valores.modelo ?? ""} placeholder="Telecaster" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field">
          Número de serie
          <input name="numero_serie" defaultValue={valores.numero_serie ?? ""} autoCapitalize="characters" />
        </label>
        <label className="field">
          Año
          <input name="anio" inputMode="numeric" defaultValue={valores.anio ?? ""} />
        </label>
      </div>
      <label className="field">
        Foto del número de serie (opcional)
        <input
          type="file"
          name="foto_serie"
          accept="image/*"
          capture="environment"
          className="!min-h-0 !p-2"
        />
      </label>

      {!compacto ? (
        <>
          <div className="mute mt-1">Datos técnicos (se completan cuando se calibra)</div>
          <div className="grid grid-cols-2 gap-[10px]">
            <label className="field">
              Calibre de cuerdas
              <input
                name="calibre_cuerdas"
                defaultValue={valores.calibre_cuerdas ?? ""}
                placeholder="010–046"
              />
            </label>
            <label className="field">
              Afinación
              <input name="afinacion" defaultValue={valores.afinacion ?? ""} placeholder="Estándar E" />
            </label>
            <label className="field">
              Escala
              <input name="escala" defaultValue={valores.escala ?? ""} placeholder='25.5"' />
            </label>
            <label className="field">
              Trastes (cantidad)
              <input
                name="trastes_cantidad"
                inputMode="numeric"
                defaultValue={valores.trastes_cantidad ?? ""}
              />
            </label>
            <label className="field">
              Material de trastes
              <input
                name="trastes_material"
                defaultValue={valores.trastes_material ?? ""}
                placeholder="Níquel"
              />
            </label>
            <label className="field">
              Calibración cada (meses)
              <input
                name="calibracion_cada_meses"
                inputMode="numeric"
                defaultValue={valores.calibracion_cada_meses ?? 6}
              />
            </label>
            <label className="field">
              Action graves (mm)
              <input
                name="action_graves_mm"
                inputMode="decimal"
                defaultValue={valores.action_graves_mm ?? ""}
              />
            </label>
            <label className="field">
              Action agudos (mm)
              <input
                name="action_agudos_mm"
                inputMode="decimal"
                defaultValue={valores.action_agudos_mm ?? ""}
              />
            </label>
          </div>
          {editando ? (
            <label className="field">
              Próxima revisión
              <input type="date" name="proxima_revision" defaultValue={valores.proxima_revision ?? ""} />
            </label>
          ) : null}
        </>
      ) : null}

      <Aviso r={r} />
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : editando ? "Guardar" : "Agregar instrumento"}
      </Boton>
    </form>
  );
}
