import { crearClienteServidor } from "@/lib/supabase/server";

export const BUCKET_PRIVADO = "fotos-privadas";
export const BUCKET_PUBLICO = "fotos-publicas";

/** Stored value for a private photo: "<bucket>:<path>". Public photos store the full URL. */
export function esRutaPrivada(valor: string | null | undefined): boolean {
  return Boolean(valor && valor.startsWith(`${BUCKET_PRIVADO}:`));
}

function extension(file: File): string {
  const porNombre = file.name.split(".").pop()?.toLowerCase();
  if (porNombre && /^[a-z0-9]{2,5}$/.test(porNombre)) return porNombre;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/** Uploads a photo to the private bucket under ordenes/<ordenId>/ and returns the stored reference. */
export async function subirFotoOrden(
  ordenId: string,
  momento: "antes" | "despues",
  file: File,
): Promise<string> {
  const supabase = await crearClienteServidor();
  const nombre = `ordenes/${ordenId}/${momento}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension(file)}`;
  const { error } = await supabase.storage.from(BUCKET_PRIVADO).upload(nombre, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
  return `${BUCKET_PRIVADO}:${nombre}`;
}

/** Uploads an instrument/serial photo (private, under instrumentos/<id>/). */
export async function subirFotoInstrumento(instrumentoId: string, file: File): Promise<string> {
  const supabase = await crearClienteServidor();
  const nombre = `instrumentos/${instrumentoId}/${Date.now()}.${extension(file)}`;
  const { error } = await supabase.storage.from(BUCKET_PRIVADO).upload(nombre, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
  return `${BUCKET_PRIVADO}:${nombre}`;
}

/** Copies a private photo into the public bucket (portfolio) and returns its public URL. */
export async function publicarFoto(referenciaPrivada: string, destino: string): Promise<string | null> {
  if (!esRutaPrivada(referenciaPrivada)) return referenciaPrivada || null;
  const supabase = await crearClienteServidor();
  const ruta = referenciaPrivada.slice(BUCKET_PRIVADO.length + 1);
  const { data: blob, error } = await supabase.storage.from(BUCKET_PRIVADO).download(ruta);
  if (error || !blob) return null;
  const nombre = `${destino}.${ruta.split(".").pop() ?? "jpg"}`;
  const { error: eUp } = await supabase.storage.from(BUCKET_PUBLICO).upload(nombre, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: true,
  });
  if (eUp) return null;
  return supabase.storage.from(BUCKET_PUBLICO).getPublicUrl(nombre).data.publicUrl;
}

/** Resolves stored references to URLs the browser can load (signed for private ones, 1 hour). */
export async function resolverFotos(
  referencias: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const resultado = new Map<string, string>();
  const privadas = referencias.filter((r): r is string => esRutaPrivada(r));
  if (privadas.length === 0) return resultado;
  const supabase = await crearClienteServidor();
  const rutas = privadas.map((r) => r.slice(BUCKET_PRIVADO.length + 1));
  const { data } = await supabase.storage.from(BUCKET_PRIVADO).createSignedUrls(rutas, 3600);
  for (const [i, firmada] of (data ?? []).entries()) {
    if (firmada.signedUrl) resultado.set(privadas[i], firmada.signedUrl);
  }
  return resultado;
}

/** Client-uploaded instrument photo: public bucket, under the client folder the RLS policy allows. */
export async function subirFotoInstrumentoCliente(
  perfilId: string,
  instrumentoId: string,
  file: File,
): Promise<string> {
  const supabase = await crearClienteServidor();
  const nombre = `perfiles/${perfilId}/instrumentos/${instrumentoId}-${Date.now()}.${extension(file)}`;
  const { error } = await supabase.storage.from(BUCKET_PUBLICO).upload(nombre, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
  return supabase.storage.from(BUCKET_PUBLICO).getPublicUrl(nombre).data.publicUrl;
}
