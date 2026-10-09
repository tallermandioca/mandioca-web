import { enviarEmail } from "./email";
import { linkWhatsapp } from "./whatsapp";

/**
 * Notification layer.
 * - whatsapp: v1 returns a wa.me link the workshop taps (no API). Swap for the Cloud API here.
 * - email: sent right away through Resend (no-op without RESEND_API_KEY).
 */
export type Canal = "whatsapp" | "email";

export interface Aviso {
  canal: Canal;
  destinatario: { nombre: string; whatsapp: string | null; email: string | null };
  asunto: string;
  texto: string;
}

export type ResultadoAviso =
  { tipo: "link"; url: string } | { tipo: "enviado" } | { tipo: "sin_destino"; motivo: string };

/** WhatsApp: builds the link. Email: sends it. */
export async function enviarAviso(aviso: Aviso): Promise<ResultadoAviso> {
  if (aviso.canal === "whatsapp") {
    const url = linkWhatsapp(aviso.destinatario.whatsapp, aviso.texto);
    return url
      ? { tipo: "link", url }
      : { tipo: "sin_destino", motivo: "El cliente no tiene WhatsApp cargado" };
  }
  if (!aviso.destinatario.email) {
    return { tipo: "sin_destino", motivo: "El cliente no tiene email cargado" };
  }
  const resultado = await enviarEmail({
    para: aviso.destinatario.email,
    asunto: aviso.asunto,
    texto: aviso.texto,
  });
  return resultado.enviado ? { tipo: "enviado" } : { tipo: "sin_destino", motivo: resultado.motivo };
}
