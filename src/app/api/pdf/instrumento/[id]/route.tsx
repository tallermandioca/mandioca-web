import { NextResponse, type NextRequest } from "next/server";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { SITIO } from "@/config/sitio";
import { obtenerSesion } from "@/lib/auth";
import {
  formatearFecha,
  formatearImporte,
  nombreInstrumento,
  ETIQUETA_TIPO_INSTRUMENTO,
} from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const estilos = StyleSheet.create({
  pagina: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#161412" },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: 2,
    borderColor: "#161412",
    paddingBottom: 8,
    marginBottom: 14,
  },
  taller: { fontSize: 14, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  kicker: { fontSize: 8, color: "#C4302B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  titulo: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  grilla: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  celda: { width: "50%", paddingVertical: 4, paddingRight: 8 },
  etiqueta: { fontSize: 8, color: "#6B645C" },
  valor: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 6,
  },
  fila: { flexDirection: "row", borderBottom: 1, borderColor: "#EEE8DC", paddingVertical: 5 },
  fecha: { width: 64, color: "#6B645C" },
  trabajo: { flex: 1 },
  importe: { width: 70, textAlign: "right" },
  pie: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#6B645C",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

/** Instrument sheet as PDF. Only the owner or the workshop can download it (RLS does the filtering). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/pdf/instrumento/[id]">) {
  const { id } = await ctx.params;
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || sesion.perfil.estado !== "activo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = await crearClienteServidor();
  const [{ data: i }, { data: historial }, { data: config }] = await Promise.all([
    supabase
      .from("instrumentos")
      .select("*, perfiles!instrumentos_dueno_id_fkey(nombre)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("ordenes")
      .select("numero, fecha_cierre, detalle_realizado, importe, cuerdas_puestas, tipos_trabajo(nombre)")
      .eq("instrumento_id", id)
      .in("estado", ["listo", "entregado"])
      .order("fecha_cierre", { ascending: false }),
    supabase.from("configuracion_publica").select("*").maybeSingle(),
  ]);
  if (!i) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const nombre = nombreInstrumento(i);
  const datos: [string, string][] = [
    ["Tipo", ETIQUETA_TIPO_INSTRUMENTO[i.tipo] ?? i.tipo],
    ["N° de serie", i.numero_serie ?? "—"],
    ["Año", i.anio ? String(i.anio) : "—"],
    ["Cuerdas", i.calibre_cuerdas ?? "—"],
    ["Afinación", i.afinacion ?? "—"],
    ["Escala", i.escala ?? "—"],
    [
      "Trastes",
      i.trastes_cantidad
        ? `${i.trastes_cantidad}${i.trastes_material ? ` · ${i.trastes_material}` : ""}`
        : "—",
    ],
    [
      "Action (12° traste)",
      i.action_graves_mm !== null && i.action_agudos_mm !== null
        ? `${i.action_graves_mm} / ${i.action_agudos_mm} mm`
        : "—",
    ],
    ["Calibración cada", `${i.calibracion_cada_meses} meses`],
    ["Próxima revisión", formatearFecha(i.proxima_revision)],
  ];

  const doc = (
    <Document title={`Ficha ${nombre}`} author={config?.nombre_taller ?? SITIO.nombre}>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.cabecera}>
          <Text style={estilos.taller}>{config?.nombre_taller ?? SITIO.nombre}</Text>
          <Text style={{ fontSize: 8, color: "#6B645C" }}>
            {config?.instagram_user ? `@${config.instagram_user}` : ""}
            {config?.whatsapp ? `  ·  WhatsApp ${config.whatsapp}` : ""}
          </Text>
        </View>
        <Text style={estilos.kicker}>Ficha del instrumento</Text>
        <Text style={estilos.titulo}>{nombre}</Text>
        <Text style={{ marginBottom: 10, color: "#4A443D" }}>Dueño: {i.perfiles?.nombre ?? "—"}</Text>
        <View style={estilos.grilla}>
          {datos.map(([k, v]) => (
            <View key={k} style={estilos.celda}>
              <Text style={estilos.etiqueta}>{k}</Text>
              <Text style={estilos.valor}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={estilos.h2}>Historial de trabajos</Text>
        {(historial ?? []).length === 0 ? (
          <Text style={{ color: "#6B645C" }}>Sin trabajos cerrados.</Text>
        ) : null}
        {(historial ?? []).map((o) => (
          <View key={o.numero} style={estilos.fila} wrap={false}>
            <Text style={estilos.fecha}>{formatearFecha(o.fecha_cierre)}</Text>
            <View style={estilos.trabajo}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                {o.tipos_trabajo?.nombre ?? "Trabajo"} · #{String(o.numero).padStart(4, "0")}
              </Text>
              {o.detalle_realizado ? <Text style={{ color: "#4A443D" }}>{o.detalle_realizado}</Text> : null}
              {o.cuerdas_puestas ? (
                <Text style={{ color: "#6B645C" }}>Cuerdas: {o.cuerdas_puestas}</Text>
              ) : null}
            </View>
            <Text style={estilos.importe}>{o.importe !== null ? formatearImporte(o.importe) : ""}</Text>
          </View>
        ))}
        <View style={estilos.pie} fixed>
          <Text>Generado el {formatearFecha(new Date())}</Text>
          <Text>
            {SITIO.url}/i/{i.qr_token}
          </Text>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  const archivo = `ficha-${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${archivo}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
