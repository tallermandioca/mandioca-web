import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { requerirRol } from "@/lib/auth";
import { SITIO } from "@/config/sitio";
import { nombreInstrumento } from "@/lib/formato";
import { resolverFotos } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioInstrumento } from "../../clientes/FormularioInstrumento";

export const dynamic = "force-dynamic";

export const metadata = { title: "Instrumento" };

export default async function EditarInstrumento({ params }: PageProps<"/taller/instrumentos/[id]">) {
  await requerirRol("admin", "/taller/clientes");
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: i } = await supabase
    .from("instrumentos")
    .select("*, perfiles!instrumentos_dueno_id_fkey(id, nombre)")
    .eq("id", id)
    .maybeSingle();
  if (!i) notFound();
  const fotos = await resolverFotos([i.foto_serie_url, i.foto_url]);

  return (
    <Contenido>
      <Link
        href={`/taller/clientes/${i.perfiles?.id}`}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> {i.perfiles?.nombre ?? "Cliente"}
      </Link>
      <h1 className="h1 text-[30px]">{nombreInstrumento(i)}</h1>
      <div className="mute">
        Etiqueta QR: <code>{i.qr_token}</code> · {SITIO.url}/i/{i.qr_token}
      </div>
      <div className="flex gap-2">
        <BotonEnlace href={`/taller/ordenes/nueva?instrumento=${i.id}`} tamano="chico" className="flex-1">
          Nueva orden
        </BotonEnlace>
        <BotonEnlace
          href={`/taller/configuracion/etiquetas?token=${i.qr_token}`}
          variante="borde"
          tamano="chico"
          className="flex-1"
        >
          Imprimir etiqueta
        </BotonEnlace>
      </div>
      {i.foto_serie_url ? (
        <div>
          <div className="mute mb-1">Número de serie</div>
          <Foto url={fotos.get(i.foto_serie_url) ?? null} alt="Foto del número de serie" className="h-40" />
        </div>
      ) : null}
      <FormularioInstrumento
        valores={{
          id: i.id,
          tipo: i.tipo,
          marca: i.marca,
          modelo: i.modelo,
          anio: i.anio,
          numero_serie: i.numero_serie,
          calibre_cuerdas: i.calibre_cuerdas,
          afinacion: i.afinacion,
          escala: i.escala,
          trastes_cantidad: i.trastes_cantidad,
          trastes_material: i.trastes_material,
          action_graves_mm: i.action_graves_mm,
          action_agudos_mm: i.action_agudos_mm,
          calibracion_cada_meses: i.calibracion_cada_meses,
          proxima_revision: i.proxima_revision,
        }}
      />
    </Contenido>
  );
}
