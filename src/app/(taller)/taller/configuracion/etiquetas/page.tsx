import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { Nota } from "@/components/ui/Etiquetas";
import { SITIO } from "@/config/sitio";
import { requerirRol } from "@/lib/auth";
import { nombreInstrumento } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import { HojaEtiquetas, type Etiqueta } from "./HojaEtiquetas";

export const dynamic = "force-dynamic";

export const metadata = { title: "Etiquetas QR" };

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
}

/**
 * Printable A4 sheet of QR labels.
 * ?token=<qr_token>  six copies of one instrument's label
 * default            one label per instrument, newest first (up to 24)
 */
export default async function Etiquetas({ searchParams }: PageProps<"/taller/configuracion/etiquetas">) {
  await requerirRol("admin", "/taller/configuracion/etiquetas");
  const sp = await searchParams;
  const token = primero(sp.token);
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("instrumentos")
    .select("qr_token, marca, modelo, tipo, perfiles!instrumentos_dueno_id_fkey(nombre)")
    .order("created_at", { ascending: false })
    .limit(24);
  if (token) consulta = consulta.eq("qr_token", token);
  const { data } = await consulta;

  let etiquetas: Etiqueta[] = await Promise.all(
    (data ?? []).map(async (i) => ({
      token: i.qr_token,
      titulo: nombreInstrumento(i),
      subtitulo: i.perfiles?.nombre ?? "",
      svg: await qrSvg(`${SITIO.url}/i/${i.qr_token}`),
    })),
  );
  if (token && etiquetas.length === 1) {
    etiquetas = Array.from({ length: 6 }, () => etiquetas[0]);
  }

  return (
    <>
      <Contenido className="print:hidden">
        <Link
          href="/taller/configuracion"
          className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
        >
          <ArrowLeft className="size-5" aria-hidden /> Configuración
        </Link>
        <h1 className="h1 text-[30px]">Etiquetas QR</h1>
        <p className="lead">Imprimí la hoja en A4 y pegá cada etiqueta en el estuche o en el clavijero.</p>
        {token ? (
          <Link
            href="/taller/configuracion/etiquetas"
            className="text-[13px] font-semibold text-red no-underline"
          >
            Ver todas las etiquetas
          </Link>
        ) : null}
        {etiquetas.length === 0 ? <Nota>No hay instrumentos cargados todavía.</Nota> : null}
      </Contenido>
      <HojaEtiquetas etiquetas={etiquetas} />
    </>
  );
}
