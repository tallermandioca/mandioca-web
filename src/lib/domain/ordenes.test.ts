import { describe, expect, it } from "vitest";
import { ESTADOS_ORDEN, siguientesEstados, transicionValida } from "./ordenes";

describe("transicionValida", () => {
  it("follows the happy path in order", () => {
    expect(transicionValida("recibido", "presupuestado", false)).toBe(true);
    expect(transicionValida("presupuestado", "aprobado", false)).toBe(true);
    expect(transicionValida("aprobado", "en_proceso", false)).toBe(true);
    expect(transicionValida("en_proceso", "listo", false)).toBe(true);
    expect(transicionValida("listo", "entregado", false)).toBe(true);
  });

  it("rejects skipping steps", () => {
    expect(transicionValida("recibido", "listo", false)).toBe(false);
    expect(transicionValida("recibido", "en_proceso", false)).toBe(false);
    expect(transicionValida("presupuestado", "en_proceso", false)).toBe(false);
    expect(transicionValida("listo", "recibido", false)).toBe(false);
  });

  it("lets templates without quote jump from recibido to en_proceso", () => {
    expect(transicionValida("recibido", "en_proceso", true)).toBe(true);
    expect(transicionValida("recibido", "listo", true)).toBe(false);
  });

  it("allows cancelling only before listo", () => {
    expect(transicionValida("recibido", "cancelado", false)).toBe(true);
    expect(transicionValida("presupuestado", "cancelado", false)).toBe(true);
    expect(transicionValida("en_proceso", "cancelado", false)).toBe(true);
    expect(transicionValida("listo", "cancelado", false)).toBe(false);
    expect(transicionValida("entregado", "cancelado", false)).toBe(false);
    expect(transicionValida("cancelado", "cancelado", false)).toBe(true);
  });

  it("treats staying in the same state as valid", () => {
    for (const estado of ESTADOS_ORDEN) {
      expect(transicionValida(estado, estado, false)).toBe(true);
    }
  });
});

describe("siguientesEstados", () => {
  it("lists the reachable states excluding the current one", () => {
    expect(siguientesEstados("recibido", false)).toEqual(["presupuestado", "cancelado"]);
    expect(siguientesEstados("recibido", true)).toEqual(["presupuestado", "en_proceso", "cancelado"]);
    expect(siguientesEstados("listo", false)).toEqual(["entregado"]);
    expect(siguientesEstados("entregado", false)).toEqual([]);
  });
});
