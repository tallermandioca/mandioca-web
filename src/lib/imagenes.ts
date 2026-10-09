/**
 * Client-side photo compression. Phone cameras produce 2–5 MB files; server
 * actions and Vercel cap request bodies, so photos are resized before upload.
 */
export const LADO_MAXIMO = 1600;
export const CALIDAD_JPEG = 0.82;

function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

/** Returns a JPEG no larger than LADO_MAXIMO on its longest side. Falls back to the original on failure. */
export async function comprimirImagen(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const img = await cargarImagen(file);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
    const ancho = Math.round(img.width * escala);
    const alto = Math.round(img.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, ancho, alto);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG),
    );
    if (!blob) return file;
    if (blob.size >= file.size && escala === 1) return file;
    const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
