import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./redirect";

const BARRA_INVERTIDA = String.fromCharCode(92);

describe("destinoSeguro", () => {
  it("keeps same-origin paths with query", () => {
    expect(destinoSeguro("/mi-cuenta")).toBe("/mi-cuenta");
    expect(destinoSeguro("/en-venta?revisado=1")).toBe("/en-venta?revisado=1");
    expect(destinoSeguro("/i/demo-tele-78")).toBe("/i/demo-tele-78");
  });

  it("rejects open-redirect tricks", () => {
    expect(destinoSeguro("//evil.com")).toBeNull();
    expect(destinoSeguro(`/${BARRA_INVERTIDA}evil.com`)).toBeNull();
    expect(destinoSeguro("/%09/evil.com")).toBeNull();
    expect(destinoSeguro("/%5cevil.com")).toBeNull();
    expect(destinoSeguro("/\t/evil.com")).toBeNull();
    expect(destinoSeguro("https://evil.com")).toBeNull();
    expect(destinoSeguro("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty, non-string and loop targets", () => {
    expect(destinoSeguro(null)).toBeNull();
    expect(destinoSeguro("")).toBeNull();
    expect(destinoSeguro("/ingreso")).toBeNull();
    expect(destinoSeguro("/auth/callback")).toBeNull();
  });
});
