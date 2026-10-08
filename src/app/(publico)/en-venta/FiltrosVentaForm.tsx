import type { FiltrosVenta } from "@/lib/datos/publico";

/** Plain GET form: works without JavaScript and keeps the page server-rendered. */
export function FiltrosVentaForm({ filtros }: { filtros: FiltrosVenta }) {
  return (
    <form method="get" action="/en-venta" className="card flex flex-col gap-[10px] p-3">
      {filtros.tipo ? <input type="hidden" name="tipo" value={filtros.tipo} /> : null}
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field">
          Precio mínimo
          <input
            type="number"
            name="min"
            inputMode="numeric"
            min={0}
            step={1000}
            defaultValue={filtros.precioMin ?? ""}
            placeholder="0"
          />
        </label>
        <label className="field">
          Precio máximo
          <input
            type="number"
            name="max"
            inputMode="numeric"
            min={0}
            step={1000}
            defaultValue={filtros.precioMax ?? ""}
            placeholder="Sin tope"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            name="revisado"
            value="1"
            defaultChecked={filtros.revisado}
            className="size-[22px] accent-red"
          />
          Solo revisados por el taller
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            name="estuche"
            value="1"
            defaultChecked={filtros.estuche}
            className="size-[22px] accent-red"
          />
          Con estuche
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            name="permuta"
            value="1"
            defaultChecked={filtros.permuta}
            className="size-[22px] accent-red"
          />
          Acepta permuta
        </label>
      </div>
      <div className="flex items-end gap-[10px]">
        <label className="field flex-1">
          Ordenar por
          <select name="orden" defaultValue={filtros.orden ?? "fecha"}>
            <option value="fecha">Más recientes</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-[46px] items-center justify-center rounded-md bg-ink px-4 font-bold text-paper"
        >
          Aplicar
        </button>
      </div>
    </form>
  );
}
