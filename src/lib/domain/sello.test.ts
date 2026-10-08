import { describe, expect, it } from "vitest";
import { puedeMarcarSello } from "./sello";

const d = (iso: string) => new Date(`${iso}T00:00:00`);
const hoy = d("2026-10-08");

describe("puedeMarcarSello", () => {
  it("accepts a closed order from the last six months", () => {
    expect(puedeMarcarSello({ estado: "entregado", fecha_cierre: d("2026-09-10") }, hoy)).toBe(true);
    expect(puedeMarcarSello({ estado: "listo", fecha_cierre: d("2026-04-08") }, hoy)).toBe(true);
  });

  it("rejects an order closed more than six months ago", () => {
    expect(puedeMarcarSello({ estado: "entregado", fecha_cierre: d("2026-04-07") }, hoy)).toBe(false);
    expect(puedeMarcarSello({ estado: "entregado", fecha_cierre: d("2025-12-01") }, hoy)).toBe(false);
  });

  it("rejects orders that are not closed", () => {
    expect(puedeMarcarSello({ estado: "en_proceso", fecha_cierre: null }, hoy)).toBe(false);
    expect(puedeMarcarSello({ estado: "cancelado", fecha_cierre: d("2026-09-10") }, hoy)).toBe(false);
    expect(puedeMarcarSello({ estado: "listo", fecha_cierre: null }, hoy)).toBe(false);
  });

  it("rejects a missing order", () => {
    expect(puedeMarcarSello(null, hoy)).toBe(false);
  });
});
