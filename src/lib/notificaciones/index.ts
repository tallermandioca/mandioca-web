import { linkWhatsapp } from "./whatsapp";

/**
 * Abstract notification layer.
 * v1: WhatsApp = a wa.me link the workshop taps; email = Resend (phase 4).
 * Swap `enviarWhatsapp` for a Cloud API adapter later without touching callers.
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

export function prepararAviso(aviso: Aviso): ResultadoAviso {
  if (aviso.canal === "whatsapp") {
    const url = linkWhatsapp(aviso.destinatario.whatsapp, aviso.texto);
    return url
      ? { tipo: "link", url }
      : { tipo: "sin_destino", motivo: "El cliente no tiene WhatsApp cargado" };
  }
  if (!aviso.destinatario.email) {
    return { tipo: "sin_destino", motivo: "El cliente no tiene email cargado" };
  }
  // Email sending lands in phase 4 (Resend). Until then the caller shows the text.
  return { tipo: "sin_destino", motivo: "El envío por email se habilita en la fase 4" };
}
