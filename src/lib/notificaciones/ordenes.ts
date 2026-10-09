import "server-only";

import { SITIO } from "@/config/sitio";
import { formatearImporte, nombreInstrumento } from "@/lib/formato";
import { enviarAviso } from "@/lib/notificaciones";
import {
  ASUNTO,
  PLANTILLA_LISTO,
  PLANTILLA_PRESUPUESTO,
  PLANTILLA_RECIBIDO,
  textoAviso,
} from "@/lib/notificaciones/avisos";

export type EventoOrden = "recibido" | "presupuesto" | "listo";

interface OrdenParaAviso {
  numero: number;
  presupuesto: number | null;
  avisar_cliente: boolean;
  instrumentos: { tipo: string; marca: string | null; modelo: string | null } | null;
  perfiles: {
    nombre: string;
    email: string | null;
    whatsapp: string | null;
    canal_preferido: "whatsapp" | "email";
  } | null;
}

/**
 * Sends the automatic email for an order event when the client prefers email.
 * WhatsApp clients are handled by hand from the order page (wa.me link), so nothing is sent here.
 * Never throws: a failed email must not break the workshop flow.
 */
export async function notificarOrdenPorEmail(
  orden: OrdenParaAviso,
  evento: EventoOrden,
  textoListo?: string | null,
): Promise<void> {
  if (!orden.avisar_cliente || !orden.perfiles || orden.perfiles.canal_preferido !== "email") return;
  const instrumento = orden.instrumentos ? nombreInstrumento(orden.instrumentos) : "instrumento";
  const numero = String(orden.numero).padStart(4, "0");
  const datos = {
    nombre: orden.perfiles.nombre,
    instrumento,
    numero,
    importe: formatearImporte(orden.presupuesto),
    link: `${SITIO.url}/mi-cuenta`,
  };
  const texto =
    evento === "listo"
      ? textoAviso(textoListo, PLANTILLA_LISTO, datos)
      : evento === "presupuesto"
        ? textoAviso(null, PLANTILLA_PRESUPUESTO, datos)
        : textoAviso(null, PLANTILLA_RECIBIDO, datos);
  const asunto =
    evento === "listo"
      ? ASUNTO.listo(instrumento)
      : evento === "presupuesto"
        ? ASUNTO.presupuesto(numero)
        : ASUNTO.recibido(numero);
  try {
    await enviarAviso({ canal: "email", destinatario: orden.perfiles, asunto, texto });
  } catch (e) {
    console.error("aviso por email", e instanceof Error ? e.message : e);
  }
}
