import { describe, expect, it } from "vitest";
import { linkWhatsapp, normalizarWhatsapp, rellenarPlantilla } from "./whatsapp";

describe("normalizarWhatsapp", () => {
  it("keeps full international numbers", () => {
    expect(normalizarWhatsapp("5492991234567")).toBe("5492991234567");
    expect(normalizarWhatsapp("+54 9 299 123-4567")).toBe("5492991234567");
  });

  it("adds 549 to local numbers", () => {
    expect(normalizarWhatsapp("299 123 4567")).toBe("5492991234567");
    expect(normalizarWhatsapp("02991234567")).toBe("5492991234567");
  });

  it("rejects empty or too short values", () => {
    expect(normalizarWhatsapp(null)).toBeNull();
    expect(normalizarWhatsapp("")).toBeNull();
    expect(normalizarWhatsapp("1234")).toBeNull();
  });
});

describe("linkWhatsapp", () => {
  it("builds a wa.me url with encoded text", () => {
    expect(linkWhatsapp("5492991234567", "Hola Martín! Orden #231")).toBe(
      "https://wa.me/5492991234567?text=Hola+Mart%C3%ADn%21+Orden+%23231",
    );
  });

  it("omits the text param when there is no message", () => {
    expect(linkWhatsapp("5492991234567")).toBe("https://wa.me/5492991234567");
  });

  it("returns null without a number", () => {
    expect(linkWhatsapp(null, "hola")).toBeNull();
  });
});

describe("rellenarPlantilla", () => {
  it("replaces placeholders and blanks unknown ones", () => {
    expect(
      rellenarPlantilla("Hola {nombre}, tu {instrumento} #{numero} {nada}", {
        nombre: "Ana",
        instrumento: "Yamaha",
        numero: 12,
      }),
    ).toBe("Hola Ana, tu Yamaha #12 ");
  });
});
