import { Contenido } from "@/components/layout/Marco";
import { TarjetaPublicacion } from "@/components/publico/Tarjetas";
import { BotonEnlace } from "@/components/ui/Boton";
import { Chip, Nota } from "@/components/ui/Etiquetas";
import { listarPublicaciones } from "@/lib/datos/publico";
import { ETIQUETA_TIPO_INSTRUMENTO } from "@/lib/formato";
import { FiltrosVentaForm } from "./FiltrosVentaForm";
import { hrefCon, leerFiltros, TIPOS_INSTRUMENTO } from "./filtros";

export const dynamic = "force-dynamic";

export const metadata = { title: "En venta" };

export default async function EnVenta({ searchParams }: PageProps<"/en-venta">) {
  const filtros = leerFiltros(await searchParams);
  const publicaciones = await listarPublicaciones(filtros);

  return (
    <Contenido>
      <div className="kicker">Muestrario</div>
      <h1 className="h1">Instrumentos en venta</h1>
      <p className="lead">
        De clientes del taller. Con sello = revisado acá y con ficha completa. La venta se arregla entre
        ustedes.
      </p>
      <BotonEnlace href="/mi-cuenta/publicar">Publicar mi instrumento</BotonEnlace>

      <div className="chips" aria-label="Filtrar por tipo de instrumento">
        <Chip href={hrefCon(filtros, { tipo: undefined })} activo={!filtros.tipo}>
          Todos
        </Chip>
        {TIPOS_INSTRUMENTO.map((t) => (
          <Chip key={t} href={hrefCon(filtros, { tipo: t })} activo={filtros.tipo === t}>
            {ETIQUETA_TIPO_INSTRUMENTO[t]}
          </Chip>
        ))}
      </div>

      <FiltrosVentaForm filtros={filtros} />

      {publicaciones.length === 0 ? (
        <Nota>No hay instrumentos publicados con esos filtros.</Nota>
      ) : (
        publicaciones.map((p) => <TarjetaPublicacion key={p.id} publicacion={p} />)
      )}

      <div className="card flex flex-col gap-[10px] p-4">
        <h3 className="h3">Cómo funciona</h3>
        <div>
          <b>1.</b> Publicás desde tu cuenta: elegís el instrumento, precio y fotos. La ficha se agrega sola.
        </div>
        <div>
          <b>2.</b> Opcional: el taller lo revisa y le pone el sello.
        </div>
        <div>
          <b>3.</b> El comprador te escribe por WhatsApp. El taller no cobra comisión.
        </div>
      </div>
    </Contenido>
  );
}
