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
function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SITIO_URL = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Branded email: logo, dark header, body text, a button for the first link in the text
 * and a footer. Table layout + inline styles so Gmail, Outlook and Apple Mail render it alike.
 */
export function htmlDesdeTexto(texto: string, titulo: string): string {
  const base = SITIO_URL();
  const primerLink = texto.match(/https?:\/\/[^\s"'<>]+/)?.[0] ?? null;
  const cuerpo = escaparHtml(primerLink ? texto.replace(primerLink, "").replace(/\s+$/, "") : texto).replace(
    /(https?:\/\/[^\s"'<>]+)/g,
    '<a href="$1" style="color:#C4302B;text-decoration:underline">$1</a>',
  );
  const tituloSeguro = escaparHtml(titulo);
  const boton = primerLink
    ? `<tr><td style="padding:22px 0 6px">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="background:#C4302B;border-radius:6px">
            <a href="${escaparHtml(primerLink)}" style="display:inline-block;padding:13px 22px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none">Entrar a mi cuenta</a>
          </td>
        </tr></table>
        <div style="font-size:12px;color:#6B645C;padding-top:10px">Si el botón no funciona, copiá este link: <a href="${escaparHtml(primerLink)}" style="color:#C4302B">${escaparHtml(primerLink)}</a></div>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${tituloSeguro}</title></head>
<body style="margin:0;padding:0;background:#F3EEE4">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F3EEE4">
<tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px">
    <tr><td style="background:#161412;border-radius:8px 8px 0 0;padding:18px 22px">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="padding-right:12px"><img src="${base}/icons/icon-192.png" width="44" height="44" alt="" style="display:block;border-radius:50%;background:#ffffff"></td>
        <td style="font-family:Helvetica,Arial,sans-serif;color:#F3EEE4">
          <div style="font-size:17px;font-weight:700;letter-spacing:1px;text-transform:uppercase;line-height:1.1">Taller Mandioca</div>
          <div style="font-size:12px;color:#C9C0B2;padding-top:2px">Luthería · reparación · calibración</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #D9D2C5;border-top:0;border-radius:0 0 8px 8px;padding:24px 22px;font-family:Helvetica,Arial,sans-serif;color:#161412">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C4302B;padding-bottom:8px">Aviso del taller</td></tr>
        <tr><td style="font-size:22px;font-weight:700;line-height:1.2;padding-bottom:14px">${tituloSeguro}</td></tr>
        <tr><td style="font-size:16px;line-height:1.55;color:#4A443D;white-space:pre-line">${cuerpo}</td></tr>
        ${boton}
      </table>
    </td></tr>
    <tr><td style="padding:16px 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B645C;text-align:center">
      Este aviso lo manda el sistema del Taller Mandioca. Si no corresponde, respondé este email.<br>
      <a href="${base}" style="color:#6B645C">${escaparHtml(base.replace(/^https?:\/\//, ""))}</a> · <a href="${base}/privacidad" style="color:#6B645C">Privacidad</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
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
