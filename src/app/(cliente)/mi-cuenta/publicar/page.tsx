import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { Chip, Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { misInstrumentos, misPublicaciones } from "@/lib/datos/cliente";
import { nombreInstrumento } from "@/lib/formato";
import { FormularioPublicacion } from "./FormularioPublicacion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publicar en venta" };

export default async function Publicar({ searchParams }: PageProps<"/mi-cuenta/publicar">) {
  const sesion = await requerirRol("cliente", "/mi-cuenta/publicar");
  const sp = await searchParams;
  const instrumentoId = Array.isArray(sp.instrumento) ? sp.instrumento[0] : sp.instrumento;
  const [instrumentos, publicaciones] = await Promise.all([
    misInstrumentos(),
    misPublicaciones(sesion.perfil.id),
  ]);
  const activas = new Map(
    publicaciones.filter((p) => p.estado !== "vendida").map((p) => [p.instrumento_id, p.id] as const),
  );
  const disponibles = instrumentos.filter((i) => !activas.has(i.id));
  const elegido = disponibles.find((i) => i.id === instrumentoId) ?? null;
  const yaPublicado = instrumentoId ? activas.get(instrumentoId) : undefined;

  return (
    <Contenido>
      <Link
        href="/mi-cuenta"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Mi cuenta
      </Link>
      <div className="kicker">Muestrario</div>
      <h1 className="h1 text-[30px]">Publicar mi instrumento</h1>
      <p className="lead">
        La ficha técnica se agrega sola. El trato es directo con el comprador: el taller no cobra comisión.
      </p>

      {yaPublicado ? (
        <Nota>
          Ese instrumento ya tiene una publicación.{" "}
          <Link href={`/mi-cuenta/publicaciones/${yaPublicado}`} className="font-semibold text-red">
            Verla
          </Link>
        </Nota>
      ) : null}

      {instrumentos.length === 0 ? <Nota>Todavía no tenés instrumentos cargados en el taller.</Nota> : null}
      {disponibles.length === 0 && instrumentos.length > 0 ? (
        <Nota>Todos tus instrumentos ya están publicados o en borrador.</Nota>
      ) : null}

      {disponibles.length > 0 ? (
        <>
          <div className="mute">¿Cuál?</div>
          <div className="chips">
            {disponibles.map((i) => (
              <Chip key={i.id} href={`/mi-cuenta/publicar?instrumento=${i.id}`} activo={elegido?.id === i.id}>
                {nombreInstrumento(i)}
              </Chip>
            ))}
          </div>
        </>
      ) : null}

      {elegido ? (
        <FormularioPublicacion
          valores={{ instrumento_id: elegido.id }}
          tituloSugerido={`${nombreInstrumento(elegido)}${elegido.anio ? ` ${elegido.anio}` : ""}`}
        />
      ) : null}

      {publicaciones.length > 0 ? (
        <Link href="/mi-cuenta/publicaciones" className="text-[13px] font-semibold text-red no-underline">
          Ver mis publicaciones ({publicaciones.length})
        </Link>
      ) : null}
    </Contenido>
  );
}
