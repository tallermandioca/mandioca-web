/** Shared labels for marketplace listings (client and workshop views). */
export function etiquetaPublicacion(p: { estado: string; solicita_publicacion: boolean }): {
  texto: string;
  tono: "ok" | "mute" | "warn" | "info";
} {
  if (p.estado === "publicada") return { texto: "Publicada", tono: "ok" };
  if (p.estado === "vendida") return { texto: "Vendida", tono: "mute" };
  if (p.solicita_publicacion) return { texto: "Esperando al taller", tono: "warn" };
  if (p.estado === "pausada") return { texto: "Pausada", tono: "mute" };
  return { texto: "Borrador", tono: "info" };
}
