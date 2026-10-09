"use client";

import { useActionState } from "react";
import { CamaraFotos } from "@/components/taller/CamaraFotos";
import { Dictado } from "@/components/taller/Dictado";
import { Boton } from "@/components/ui/Boton";
import { ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/domain/ordenes";
import { agregarFotos, cambiarEstado, guardarDetalles, type Resultado } from "./acciones";

function Aviso({ r }: { r: Resultado }) {
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

export function FormularioEstado({ ordenId, siguientes }: { ordenId: string; siguientes: EstadoOrden[] }) {
  const [r, accion, pendiente] = useActionState(cambiarEstado, {});
  return (
    <form action={accion} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={ordenId} />
      <div className="flex flex-wrap gap-2">
        {siguientes.map((e) => (
          <button
            key={e}
            type="submit"
            name="estado"
            value={e}
            disabled={pendiente}
            className={`min-h-10 rounded-md px-3 text-sm font-bold ${
              e === "cancelado"
                ? "border border-line text-mute"
                : e === "listo"
                  ? "bg-ok text-white"
                  : "bg-ink text-paper"
            }`}
          >
            {e === "listo" ? "Cerrar trabajo" : `Pasar a ${ETIQUETA_ESTADO[e].toLowerCase()}`}
          </button>
        ))}
      </div>
      <Aviso r={r} />
    </form>
  );
}

interface PropsDetalles {
  ordenId: string;
  estado: EstadoOrden;
  pedido: string | null;
  presupuesto: number | null;
  fechaEstimada: string | null;
  importe: number | null;
  detalle: string | null;
  cuerdas: string | null;
  proximaRevision: string | null;
  notas: string;
}

export function FormularioDetalles(p: PropsDetalles) {
  const [r, accion, pendiente] = useActionState(guardarDetalles, {});
  const cerrada = p.estado === "listo" || p.estado === "entregado";
  return (
    <form action={accion} className="card flex flex-col gap-[10px] p-3">
      <input type="hidden" name="id" value={p.ordenId} />
      <h2 className="h3">Detalles</h2>
      <Dictado name="pedido_cliente" etiqueta="Qué pidió el cliente" defaultValue={p.pedido ?? ""} rows={2} />
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field">
          Presupuesto ($)
          <input name="presupuesto" inputMode="numeric" defaultValue={p.presupuesto ?? ""} />
        </label>
        <label className="field">
          Fecha estimada
          <input type="date" name="fecha_estimada" defaultValue={p.fechaEstimada ?? ""} />
        </label>
      </div>
      {cerrada ? (
        <>
          <Dictado name="detalle_realizado" etiqueta="Qué se hizo" defaultValue={p.detalle ?? ""} rows={3} />
          <div className="grid grid-cols-2 gap-[10px]">
            <label className="field">
              Importe ($)
              <input name="importe" inputMode="numeric" defaultValue={p.importe ?? ""} />
            </label>
            <label className="field">
              Cuerdas puestas
              <input name="cuerdas_puestas" defaultValue={p.cuerdas ?? ""} />
            </label>
          </div>
          <label className="field">
            Próxima revisión
            <input type="date" name="proxima_revision" defaultValue={p.proximaRevision ?? ""} />
          </label>
        </>
      ) : null}
      <label className="field">
        Notas internas (no las ve el cliente)
        <textarea name="notas" rows={2} defaultValue={p.notas} />
      </label>
      <Aviso r={r} />
      <Boton type="submit" variante="oscuro" tamano="chico" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar"}
      </Boton>
    </form>
  );
}

export function FormularioFotos({ ordenId }: { ordenId: string }) {
  const [r, accion, pendiente] = useActionState(agregarFotos, {});
  return (
    <form action={accion} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={ordenId} />
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="momento" value="antes" defaultChecked className="accent-red" /> Antes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="momento" value="despues" className="accent-red" /> Después
        </label>
      </div>
      <CamaraFotos name="fotos" etiqueta="Agregar fotos" />
      <Aviso r={r} />
      <Boton type="submit" variante="borde" tamano="chico" disabled={pendiente}>
        {pendiente ? "Subiendo…" : "Subir fotos"}
      </Boton>
    </form>
  );
}
