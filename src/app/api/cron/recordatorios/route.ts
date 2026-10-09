import { NextResponse, type NextRequest } from "next/server";
import { SITIO } from "@/config/sitio";
import { aIsoFecha, formatearFecha, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { ASUNTO, PLANTILLA_CALIBRACION, textoAviso } from "@/lib/notificaciones/avisos";
import { enviarEmail } from "@/lib/notificaciones/email";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job (Vercel Cron, see vercel.json). Takes every pending reminder due today or earlier:
 * - email: sends it through Resend and marks it `enviado`.
 * - whatsapp: nothing to send automatically in v1; it stays `pendiente` and shows up as
 *   "Para mandar" in /taller/avisos with the wa.me link ready.
 * Protected with CRON_SECRET (Vercel sends it as a Bearer token).
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secreto || auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = crearClienteAdmin();
  const hoy = aIsoFecha(hoyArgentina());
  const { data: pendientes, error } = await supabase
    .from("recordatorios")
    .select(
      "id, tipo, canal, fecha_programada, instrumentos(id, tipo, marca, modelo, proxima_revision), perfiles!recordatorios_cliente_id_fkey(nombre, email, whatsapp)",
    )
    .eq("estado", "pendiente")
    .lte("fecha_programada", hoy)
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: config } = await supabase
    .from("configuracion")
    .select("texto_aviso_calibracion")
    .maybeSingle();

  let enviados = 0;
  let esperanWhatsapp = 0;
  const fallidos: string[] = [];

  for (const r of pendientes ?? []) {
    if (r.canal !== "email") {
      esperanWhatsapp += 1;
      continue;
    }
    const email = r.perfiles?.email;
    if (!email) {
      fallidos.push(`${r.id}: sin email`);
      continue;
    }
    const instrumento = r.instrumentos ? nombreInstrumento(r.instrumentos) : "instrumento";
    const texto = textoAviso(config?.texto_aviso_calibracion, PLANTILLA_CALIBRACION, {
      nombre: r.perfiles?.nombre ?? "",
      instrumento,
      fecha: formatearFecha(r.instrumentos?.proxima_revision ?? r.fecha_programada),
      link: `${SITIO.url}/mi-cuenta`,
    });
    const asunto = r.tipo === "cuerdas" ? ASUNTO.cuerdas(instrumento) : ASUNTO.calibracion(instrumento);
    const resultado = await enviarEmail({ para: email, asunto, texto });
    if (!resultado.enviado) {
      fallidos.push(`${r.id}: ${resultado.motivo}`);
      continue;
    }
    await supabase
      .from("recordatorios")
      .update({ estado: "enviado", enviado_at: new Date().toISOString() })
      .eq("id", r.id);
    enviados += 1;
  }

  return NextResponse.json({
    fecha: hoy,
    revisados: pendientes?.length ?? 0,
    enviados,
    esperanWhatsapp,
    fallidos,
  });
}
