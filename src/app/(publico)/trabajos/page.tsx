import Link from "next/link";
import { Contenido } from "@/components/layout/Marco";
import { TarjetaTrabajo } from "@/components/publico/Tarjetas";
import { Chip, Nota } from "@/components/ui/Etiquetas";
import { listarTrabajos, obtenerTiposTrabajoPublicos, TAMANO_PAGINA } from "@/lib/datos/publico";
import { ETIQUETA_TIPO_INSTRUMENTO } from "@/lib/formato";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Trabajos" };

type TipoInstrumento = Database["public"]["Enums"]["tipo_instrumento"];
const TIPOS_INSTRUMENTO: TipoInstrumento[] = ["electrica", "acustica", "criolla", "bajo", "otro"];

function esTipoInstrumento(valor: string | undefined): valor is TipoInstrumento {
  return TIPOS_INSTRUMENTO.includes(valor as TipoInstrumento);
}

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function armarHref(base: { tipo?: string; instrumento?: string; pagina?: number }): string {
  const params = new URLSearchParams();
  if (base.tipo) params.set("tipo", base.tipo);
  if (base.instrumento) params.set("instrumento", base.instrumento);
  if (base.pagina && base.pagina > 1) params.set("pagina", String(base.pagina));
  const qs = params.toString();
  return qs ? `/trabajos?${qs}` : "/trabajos";
}

export default async function Trabajos({ searchParams }: PageProps<"/trabajos">) {
  const sp = await searchParams;
  const tipo = primero(sp.tipo);
  const instrumentoParam = primero(sp.instrumento);
  const instrumento = esTipoInstrumento(instrumentoParam) ? instrumentoParam : undefined;
  const pagina = Math.max(1, Number(primero(sp.pagina)) || 1);

  const [tipos, { trabajos, total }] = await Promise.all([
    obtenerTiposTrabajoPublicos(),
    listarTrabajos({ tipoId: tipo, instrumento, pagina }),
  ]);
  const paginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));

  return (
    <Contenido>
      <div className="kicker">Portfolio</div>
      <h1 className="h1">Trabajos del taller</h1>
      <p className="lead">Antes y después de cada trabajo. Filtrá por tipo.</p>

      <div className="chips" aria-label="Filtrar por tipo de trabajo">
        <Chip href={armarHref({ instrumento })} activo={!tipo}>
          Todos
        </Chip>
        {tipos.map((t) => (
          <Chip key={t.id} href={armarHref({ tipo: t.id, instrumento })} activo={tipo === t.id}>
            {t.nombre}
          </Chip>
        ))}
      </div>
      <div className="chips" aria-label="Filtrar por instrumento">
        <Chip href={armarHref({ tipo })} activo={!instrumento}>
          Cualquier instrumento
        </Chip>
        {TIPOS_INSTRUMENTO.map((i) => (
          <Chip key={i} href={armarHref({ tipo, instrumento: i })} activo={instrumento === i}>
            {ETIQUETA_TIPO_INSTRUMENTO[i]}
          </Chip>
        ))}
      </div>

      {trabajos.length === 0 ? (
        <Nota>Todavía no hay trabajos de este tipo publicados.</Nota>
      ) : (
        trabajos.map((t) => <TarjetaTrabajo key={t.id} trabajo={t} />)
      )}

      {paginas > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Paginación">
          {pagina > 1 ? (
            <Link href={armarHref({ tipo, instrumento, pagina: pagina - 1 })} className="font-semibold">
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="mute">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={armarHref({ tipo, instrumento, pagina: pagina + 1 })} className="font-semibold">
              Siguientes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </Contenido>
  );
}
