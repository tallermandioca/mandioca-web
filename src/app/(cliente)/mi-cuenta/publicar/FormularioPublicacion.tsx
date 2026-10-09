"use client";

import { useActionState } from "react";
import { CamaraFotos } from "@/components/taller/CamaraFotos";
import { Boton } from "@/components/ui/Boton";
import { ETIQUETA_ESTADO_INSTRUMENTO } from "@/lib/formato";
import { crearPublicacion, guardarPublicacion, type Resultado } from "./acciones";

export interface ValoresPublicacion {
  id?: string;
  instrumento_id?: string;
  titulo?: string;
  descripcion?: string | null;
  precio?: number | null;
  estado_instrumento?: string;
  con_estuche?: boolean;
  acepta_permuta?: boolean;
  mostrar_historial?: boolean;
  pide_revision?: boolean;
}

const ESTADOS = ["excelente", "muy_bueno", "bueno", "regular"];

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

export function FormularioPublicacion({
  valores,
  tituloSugerido,
}: {
  valores: ValoresPublicacion;
  tituloSugerido?: string;
}) {
  const editando = Boolean(valores.id);
  const [r, accion, pendiente] = useActionState(editando ? guardarPublicacion : crearPublicacion, {});
  return (
    <form action={accion} className="flex flex-col gap-[12px]">
      {valores.id ? <input type="hidden" name="id" value={valores.id} /> : null}
      {valores.instrumento_id ? (
        <input type="hidden" name="instrumento_id" value={valores.instrumento_id} />
      ) : null}
      <label className="field">
        Título
        <input name="titulo" defaultValue={valores.titulo ?? tituloSugerido ?? ""} required maxLength={80} />
      </label>
      <label className="field">
        Descripción
        <textarea
          name="descripcion"
          rows={3}
          defaultValue={valores.descripcion ?? ""}
          placeholder="Estado general, qué incluye, por qué lo vendés"
          maxLength={600}
        />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field">
          Precio ($)
          <input
            name="precio"
            inputMode="numeric"
            defaultValue={valores.precio ?? ""}
            required
            placeholder="850000"
          />
        </label>
        <label className="field">
          Estado
          <select name="estado_instrumento" defaultValue={valores.estado_instrumento ?? "muy_bueno"}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO_INSTRUMENTO[e]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label className="flex min-h-10 items-center gap-3">
          <input
            type="checkbox"
            name="con_estuche"
            defaultChecked={valores.con_estuche ?? false}
            className="size-[22px] accent-red"
          />
          Con estuche o funda
        </label>
        <label className="flex min-h-10 items-center gap-3">
          <input
            type="checkbox"
            name="acepta_permuta"
            defaultChecked={valores.acepta_permuta ?? false}
            className="size-[22px] accent-red"
          />
          Acepto permuta
        </label>
        <label className="flex min-h-10 items-center gap-3">
          <input
            type="checkbox"
            name="mostrar_historial"
            defaultChecked={valores.mostrar_historial ?? true}
            className="size-[22px] accent-red"
          />
          <span>
            Mostrar el historial del taller
            <span className="mute block">Solo fechas y trabajos, sin tus datos</span>
          </span>
        </label>
        <label className="flex min-h-10 items-center gap-3">
          <input
            type="checkbox"
            name="pide_revision"
            defaultChecked={valores.pide_revision ?? false}
            className="size-[22px] accent-red"
          />
          <span>
            Pedir la revisión del taller
            <span className="mute block">
              Si lo revisan, la publicación lleva el sello &quot;Revisado por el taller&quot;
            </span>
          </span>
        </label>
      </div>
      <CamaraFotos
        name="fotos"
        etiqueta={editando ? "Agregar fotos" : "Fotos (la primera es la portada)"}
        maximo={8}
      />
      <Aviso r={r} />
      {editando ? (
        <Boton type="submit" variante="oscuro" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Boton>
      ) : (
        <div className="flex flex-col gap-2">
          <Boton type="submit" name="solicitar" value="1" disabled={pendiente}>
            {pendiente ? "Creando…" : "Publicar"}
          </Boton>
          <Boton type="submit" variante="borde" disabled={pendiente}>
            Guardar como borrador
          </Boton>
        </div>
      )}
    </form>
  );
}
