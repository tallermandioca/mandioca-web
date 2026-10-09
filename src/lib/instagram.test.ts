import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("cifrado del token de Instagram", () => {
  beforeAll(() => {
    process.env.APP_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.NEXT_PUBLIC_SITE_URL = "https://mandioca.test";
  });

  it("round-trips and never stores the plain token", async () => {
    const { cifrar, descifrar } = await import("./instagram");
    const token = "IGQVJ...token-largo";
    const cifrado = cifrar(token);
    expect(cifrado.startsWith("v1.")).toBe(true);
    expect(cifrado).not.toContain(token);
    expect(descifrar(cifrado)).toBe(token);
    expect(cifrar(token)).not.toBe(cifrado); // random IV
  });

  it("rejects tampered values", async () => {
    const { cifrar, descifrar } = await import("./instagram");
    const cifrado = cifrar("abc");
    const partes = cifrado.split(".");
    partes[3] = Buffer.from("zzz").toString("base64");
    expect(() => descifrar(partes.join("."))).toThrow();
    expect(() => descifrar("nada")).toThrow();
  });

  it("builds the authorization url with the callback", async () => {
    process.env.INSTAGRAM_APP_ID = "123";
    const { urlAutorizacion } = await import("./instagram");
    const url = new URL(urlAutorizacion("estado"));
    expect(url.origin + url.pathname).toBe("https://www.instagram.com/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("123");
    expect(url.searchParams.get("redirect_uri")).toBe("https://mandioca.test/api/instagram/callback");
    expect(url.searchParams.get("state")).toBe("estado");
  });
});
