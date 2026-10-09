/**
 * Accepts only same-origin paths for post-login redirects.
 * Rejects protocol-relative, backslash and control-character tricks (open redirect).
 */
export function destinoSeguro(volver: unknown): string | null {
  if (typeof volver !== "string" || volver.length === 0 || volver.length > 2000) return null;
  if (!volver.startsWith("/") || volver.startsWith("//")) return null;
  // Backslashes, whitespace and control characters are normalised away by browsers.
  for (const ch of volver) {
    const code = ch.charCodeAt(0);
    if (ch === "\\" || code <= 0x20 || code === 0x7f) return null;
  }
  if (/%0[0-9a-f]|%1[0-9a-f]|%5c|%2f%2f/i.test(volver)) return null;
  const base = "http://mandioca.invalid";
  let url: URL;
  try {
    url = new URL(volver, base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;
  if (url.pathname === "/ingreso" || url.pathname.startsWith("/auth/")) return null;
  return url.pathname + url.search;
}
