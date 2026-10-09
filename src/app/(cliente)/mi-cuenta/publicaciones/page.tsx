import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { Nota, Pill } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { misPublicaciones } from "@/lib/datos/cliente";
import { formatearImporte } from "@/lib/formato";
import { etiquetaPublicacion } from "@/lib/publicaciones";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis publicaciones" };

export default async function MisPublicaciones() {
  const sesion = await requerirRol("cliente", "/mi-cuenta/publicaciones");
  const publicaciones = await misPublicaciones(sesion.perfil.id);
  return (
    <Contenido>
      <Link
        href="/mi-cuenta"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mi cuenta
      </Link>
      <h1 className="h1 text-[30px]">Mis publicaciones</h1>
      {publicaciones.length === 0 ? <Nota>Todavía no publicaste nada.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {publicaciones.map((p) => {
          const e = etiquetaPublicacion(p);
          const foto = [...p.fotos_publicacion].sort((a, b) => a.orden - b.orden)[0]?.url ?? null;
          return (
            <Link
              key={p.id}
              href={`/mi-cuenta/publicaciones/${p.id}`}
              className="card flex items-center gap-3 p-[10px] no-underline text-ink"
            >
              <Foto url={foto} alt="" className="size-[60px] shrink-0 text-[10px]" sizes="60px" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="h3 text-[17px]">{p.titulo}</span>
                <span className="mute">
                  {formatearImporte(p.precio, p.moneda)}
                  {p.revisado_por_taller ? " · con sello" : ""}
                </span>
              </span>
              <Pill tono={e.tono}>{e.texto}</Pill>
              <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
            </Link>
          );
        })}
      </div>
      <BotonEnlace href="/mi-cuenta/publicar" variante="borde">
        Publicar otro instrumento
      </BotonEnlace>
    </Contenido>
  );
}
