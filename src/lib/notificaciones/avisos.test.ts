import { describe, expect, it } from "vitest";
import { PLANTILLA_CALIBRACION, PLANTILLA_LISTO, textoAviso } from "./avisos";

describe("textoAviso", () => {
  it("uses the default template and the first name", () => {
    expect(
      textoAviso(null, PLANTILLA_LISTO, {
        nombre: "Martín Suárez",
        instrumento: "Jazz Bass",
        numero: "0231",
      }),
    ).toBe("Hola Martín! Tu Jazz Bass está listo para retirar. Orden #0231. Te esperamos en el taller.");
  });

  it("prefers the workshop's template when present and ignores blank ones", () => {
    expect(
      textoAviso("Che {nombre}, {instrumento} listo", PLANTILLA_LISTO, {
        nombre: "Ana",
        instrumento: "Yamaha",
      }),
    ).toBe("Che Ana, Yamaha listo");
    expect(
      textoAviso("   ", PLANTILLA_CALIBRACION, { nombre: "Ana", instrumento: "Yamaha", fecha: "15/01/2027" }),
    ).toContain("vence el 15/01/2027");
  });
});
