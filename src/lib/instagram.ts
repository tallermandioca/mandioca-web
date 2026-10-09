import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { SITIO } from "@/config/sitio";

/**
 * Instagram API with Instagram Login (Meta). The site never calls Instagram at request time:
 * posts are cached in `instagram_posts` by the daily cron, and the long-lived token (60 days)
 * is refreshed by the same cron when it is about to expire.
 */

export const IG_SCOPES = "instagram_business_basic";
export const IG_AUTH_URL = "https://www.instagram.com/oauth/authorize";
export const IG_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
export const IG_GRAPH = "https://graph.instagram.com";

export function instagramConfigurado(): boolean {
  return Boolean(
    process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET && process.env.APP_SECRET_KEY,
  );
}

export function urlCallbackInstagram(): string {
  return `${SITIO.url}/api/instagram/callback`;
}

export function urlAutorizacion(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? "",
    redirect_uri: urlCallbackInstagram(),
    scope: IG_SCOPES,
    response_type: "code",
    state,
  });
  return `${IG_AUTH_URL}?${params.toString()}`;
}

// --- token encryption (AES-256-GCM, key from APP_SECRET_KEY) -------------------------

function clave(): Buffer {
  const raw = process.env.APP_SECRET_KEY;
  if (!raw) throw new Error("Falta APP_SECRET_KEY");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("APP_SECRET_KEY tiene que ser 32 bytes en base64");
  return buf;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", clave(), iv);
  const datos = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64")}.${tag.toString("base64")}.${datos.toString("base64")}`;
}

export function descifrar(valor: string): string {
  const [version, iv, tag, datos] = valor.split(".");
  if (version !== "v1" || !iv || !tag || !datos) throw new Error("Token cifrado inválido");
  const decipher = createDecipheriv("aes-256-gcm", clave(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(datos, "base64")), decipher.final()]).toString("utf8");
}

// --- OAuth ----------------------------------------------------------------------

export interface TokenLargo {
  token: string;
  venceAt: Date;
}

/** code -> short-lived token -> long-lived token (60 days). */
export async function canjearCodigo(code: string): Promise<TokenLargo> {
  const cuerpo = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? "",
    client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
    grant_type: "authorization_code",
    redirect_uri: urlCallbackInstagram(),
    code,
  });
  const r1 = await fetch(IG_TOKEN_URL, { method: "POST", body: cuerpo });
  const j1 = (await r1.json()) as {
    access_token?: string;
    error_message?: string;
    error?: { message?: string };
  };
  if (!r1.ok || !j1.access_token) {
    throw new Error(j1.error_message ?? j1.error?.message ?? "Instagram rechazó el código");
  }
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
    access_token: j1.access_token,
  });
  const r2 = await fetch(`${IG_GRAPH}/access_token?${params.toString()}`);
  const j2 = (await r2.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!r2.ok || !j2.access_token) throw new Error(j2.error?.message ?? "No se pudo obtener el token largo");
  return { token: j2.access_token, venceAt: new Date(Date.now() + (j2.expires_in ?? 5_184_000) * 1000) };
}

/** Refreshes a long-lived token (must be at least 24 h old and not expired). */
export async function refrescarToken(token: string): Promise<TokenLargo> {
  const params = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
  const r = await fetch(`${IG_GRAPH}/refresh_access_token?${params.toString()}`);
  const j = (await r.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!r.ok || !j.access_token) throw new Error(j.error?.message ?? "No se pudo refrescar el token");
  return { token: j.access_token, venceAt: new Date(Date.now() + (j.expires_in ?? 5_184_000) * 1000) };
}

// --- media ----------------------------------------------------------------------

export interface PostInstagram {
  ig_id: string;
  tipo: "imagen" | "video" | "carrusel";
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  caption: string | null;
  fecha: string;
}

interface MediaApi {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

export async function obtenerUltimosPosts(token: string, cantidad = 12): Promise<PostInstagram[]> {
  const params = new URLSearchParams({
    fields: "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp",
    limit: String(cantidad),
    access_token: token,
  });
  const r = await fetch(`${IG_GRAPH}/me/media?${params.toString()}`);
  const j = (await r.json()) as { data?: MediaApi[]; error?: { message?: string } };
  if (!r.ok || !j.data) throw new Error(j.error?.message ?? "No se pudieron leer las publicaciones");
  return j.data
    .filter((m) => m.media_url || m.thumbnail_url)
    .map((m) => ({
      ig_id: m.id,
      tipo: m.media_type === "VIDEO" ? "video" : m.media_type === "CAROUSEL_ALBUM" ? "carrusel" : "imagen",
      media_url: m.media_url ?? m.thumbnail_url ?? "",
      thumbnail_url: m.thumbnail_url ?? null,
      permalink: m.permalink,
      caption: m.caption ?? null,
      fecha: m.timestamp,
    }));
}
