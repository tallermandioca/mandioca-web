import { describe, expect, it } from "vitest";
import {
  aIsoFecha,
  fechaDesdeIso,
  formatearFecha,
  formatearImporte,
  formatearMesAnio,
  nombreInstrumento,
  parsearImporte,
} from "./formato";

describe("fechas", () => {
  it("parses a Postgres date as a local day and formats it", () => {
    const f = fechaDesdeIso("2026-09-12");
    expect(f?.getDate()).toBe(12);
    expect(formatearFecha("2026-09-12")).toBe("12/09/2026");
    expect(formatearMesAnio("2026-09-12")).toBe("09/2026");
    expect(aIsoFecha(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatearFecha(null)).toBe("—");
  });
});

describe("formatearImporte", () => {
  it("formats pesos without decimals and handles empties", () => {
    expect(formatearImporte(850000).replace(/\s/g, " ")).toBe("$ 850.000");
    expect(formatearImporte("45000")).toContain("45.000");
    expect(formatearImporte(null)).toBe("—");
  });
});

describe("nombreInstrumento", () => {
  it("joins brand and model, falling back to the type", () => {
    expect(nombreInstrumento({ marca: "Fender", modelo: "Telecaster '78" })).toBe("Fender Telecaster '78");
    expect(nombreInstrumento({ marca: null, modelo: null, tipo: "bajo" })).toBe("Bajo");
  });
});

describe("parsearImporte", () => {
  it("understands Argentine and raw formats", () => {
    expect(parsearImporte("12.500,50")).toBe(12500.5);
    expect(parsearImporte("12500,5")).toBe(12500.5);
    expect(parsearImporte("12500.5")).toBe(12500.5);
    expect(parsearImporte("850000")).toBe(850000);
    expect(parsearImporte("850.000")).toBe(850000);
    expect(parsearImporte("$ 1.250.000")).toBe(1250000);
    expect(parsearImporte("")).toBeNull();
    expect(parsearImporte("abc")).toBeNull();
    expect(parsearImporte("-5")).toBeNull();
  });
});
