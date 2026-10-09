import "server-only";

import { Resend } from "resend";

/**
 * Transactional email through Resend. Without RESEND_API_KEY nothing is sent:
 * the message is logged and the caller gets `{ enviado: false }`.
 */
export interface Email {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
}

export type ResultadoEmail = { enviado: true; id: string | null } | { enviado: false; motivo: string };

function remitente(): string {
  return process.env.EMAIL_FROM?.trim() || "Taller Mandioca <onboarding@resend.dev>";
}

export function emailHabilitado(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Minimal HTML wrapper so plain text templates look decent in mail clients. */
export function htmlDesdeTexto(texto: string, titulo: string): string {
  const escapado = texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const conLinks = escapado.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#C4302B">$1</a>');
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F3EEE4;font-family:Helvetica,Arial,sans-serif;color:#161412">
<div style="max-width:520px;margin:0 auto;padding:24px 18px">
  <div style="background:#161412;color:#F3EEE4;padding:14px 18px;border-radius:6px 6px 0 0;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Taller Mandioca</div>
  <div style="background:#fff;border:1px solid #D9D2C5;border-top:0;padding:18px;border-radius:0 0 6px 6px">
    <h1 style="font-size:18px;margin:0 0 12px">${titulo}</h1>
    <p style="white-space:pre-line;line-height:1.5;margin:0">${conLinks}</p>
  </div>
  <p style="font-size:12px;color:#6B645C;margin-top:12px">Este aviso lo manda el sistema del taller. Si no corresponde, respondé este email.</p>
</div></body></html>`;
}

export async function enviarEmail(email: Email): Promise<ResultadoEmail> {
  if (!emailHabilitado()) {
    console.info(`[email no enviado] para=${email.para} asunto=${email.asunto}`);
    return { enviado: false, motivo: "Falta RESEND_API_KEY" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: remitente(),
    to: email.para,
    subject: email.asunto,
    text: email.texto,
    html: email.html ?? htmlDesdeTexto(email.texto, email.asunto),
  });
  if (error) return { enviado: false, motivo: error.message };
  return { enviado: true, id: data?.id ?? null };
}
