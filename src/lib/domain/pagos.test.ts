import { describe, expect, it } from "vitest";
import { ordenesConDeuda, saldoOrden, sumarPagos, totalOrden } from "./pagos";

describe("pagos", () => {
  it("uses the final amount when set, otherwise the quote", () => {
    expect(totalOrden({ estado: "listo", presupuesto: 105000, importe: 110000 })).toBe(110000);
    expect(totalOrden({ estado: "en_proceso", presupuesto: "105000.00", importe: null })).toBe(105000);
    expect(totalOrden({ estado: "recibido", presupuesto: null, importe: null })).toBe(0);
  });

  it("subtracts payments and never goes below zero", () => {
    const o = { estado: "listo" as const, presupuesto: 105000, importe: null };
    expect(saldoOrden(o, sumarPagos([{ monto: "50000.00" }, { monto: 15000 }]))).toBe(40000);
    expect(saldoOrden(o, 120000)).toBe(0);
    expect(saldoOrden({ ...o, estado: "cancelado" }, 0)).toBe(0);
  });

  it("only counts finished orders as debt", () => {
    const ordenes = [
      { id: "a", estado: "listo" as const, presupuesto: 100, importe: null },
      { id: "b", estado: "en_proceso" as const, presupuesto: 200, importe: null },
      { id: "c", estado: "entregado" as const, presupuesto: null, importe: 300 },
      { id: "d", estado: "entregado" as const, presupuesto: null, importe: 50 },
    ];
    const deuda = ordenesConDeuda(ordenes, new Map([["c", 100], ["d", 50]]));
    expect(deuda.map((d) => [d.orden.id, d.saldo])).toEqual([
      ["a", 100],
      ["c", 200],
    ]);
  });
});
