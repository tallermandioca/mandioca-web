"use client";

import { useActionState } from "react";
import { FotoUnica } from "@/components/taller/FotoUnica";
import { Boton } from "@/components/ui/Boton";
import { actualizarMiInstrumento } from "./acciones";

export function FormularioInstrumentoCliente({ id, calibre }: { id: string; calibre: string | null }) {
  const [r, accion, pendiente] = useActionState(actualizarMiInstrumento, {});
  return (
    <form action={accion} className="card flex flex-col gap-[10px] p-3">
      <input type="hidden" name="id" value={id} />
      <h2 className="h3">Lo que podés cambiar vos</h2>
      <FotoUnica name="foto" etiqueta="Foto del instrumento" />
      <label className="field">
        Calibre de cuerdas que usás
        <input name="calibre_cuerdas" defaultValue={calibre ?? ""} placeholder="010–046" />
      </label>
      <div className="mute">El resto de la ficha lo carga el taller cuando revisa el instrumento.</div>
      {r.error ? (
        <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
          {r.error}
        </div>
      ) : null}
      {r.mensaje ? (
        <div role="status" className="rounded-sm bg-ok-bg px-3 py-2 text-sm text-ok-t">
          {r.mensaje}
        </div>
      ) : null}
      <Boton type="submit" variante="oscuro" tamano="chico" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar"}
      </Boton>
    </form>
  );
}
