"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { aprobarPresupuesto } from "./acciones";

export function BotonAprobar({
  ordenId,
  presupuesto,
  importe,
}: {
  ordenId: string;
  presupuesto: number;
  importe: string;
}) {
  const [r, accion, pendiente] = useActionState(aprobarPresupuesto, {});
  if (r.mensaje) {
    return (
      <div role="status" className="rounded-sm bg-ok-bg px-[14px] py-3 text-sm text-ok-t">
        {r.mensaje}
      </div>
    );
  }
  return (
    <form action={accion} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={ordenId} />
      <input type="hidden" name="presupuesto" value={String(presupuesto)} />
      {r.error ? (
        <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
          {r.error}
        </div>
      ) : null}
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Aprobando…" : `Aprobar presupuesto de ${importe}`}
      </Boton>
    </form>
  );
}
