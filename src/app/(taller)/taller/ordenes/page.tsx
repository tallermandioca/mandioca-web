import { Contenido } from "@/components/layout/Marco";
import { ItemOrden } from "@/components/taller/Ordenes";
import { Chip, Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { ordenesPorEstado } from "@/lib/datos/taller";
import { ESTADOS_ABIERTOS, ESTADOS_ORDEN, ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/domain/ordenes";
import { hoyArgentina } from "@/lib/hoy";

export const dynamic = "force-dynamic";

export const metadata = { title: "Órdenes" };

export default async function Ordenes({ searchParams }: PageProps<"/taller/ordenes">) {
  await requerirRol("admin", "/taller/ordenes");
  const sp = await searchParams;
  const estadoParam = Array.isArray(sp.estado) ? sp.estado[0] : sp.estado;
  const estado = ESTADOS_ORDEN.includes(estadoParam as EstadoOrden) ? (estadoParam as EstadoOrden) : null;
  const ordenes = await ordenesPorEstado(estado ? [estado] : [...ESTADOS_ORDEN], 100);
  const hoy = hoyArgentina();

  return (
    <Contenido>
      <h1 className="h1 text-[30px]">Órdenes</h1>
      <div className="chips">
        <Chip href="/taller/ordenes" activo={!estado}>
          Todas
        </Chip>
        {ESTADOS_ORDEN.map((e) => (
          <Chip key={e} href={`/taller/ordenes?estado=${e}`} activo={estado === e}>
            {ETIQUETA_ESTADO[e]}
          </Chip>
        ))}
      </div>
      {ordenes.length === 0 ? <Nota>No hay órdenes en ese estado.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {ordenes.map((o) => (
          <ItemOrden key={o.id} orden={o} hoy={hoy} />
        ))}
      </div>
      {!estado ? (
        <div className="mute">Se muestran las últimas 100. Abiertas: {ESTADOS_ABIERTOS.length} estados.</div>
      ) : null}
    </Contenido>
  );
}
