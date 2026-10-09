import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { EstadoPill, numeroOrden } from "@/components/taller/Ordenes";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { ordenesPorEstado } from "@/lib/datos/taller";
import { nombreInstrumento } from "@/lib/formato";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cierre del día" };

export default async function CierreDelDia({ searchParams }: PageProps<"/taller/cierre">) {
  await requerirRol("admin", "/taller/cierre");
  const sp = await searchParams;
  const cerrada = Array.isArray(sp.cerrada) ? sp.cerrada[0] : sp.cerrada;
  const portfolio = Array.isArray(sp.portfolio) ? sp.portfolio[0] : sp.portfolio;
  const ordenes = await ordenesPorEstado(["en_proceso", "aprobado", "recibido"], 100);

  return (
    <Contenido>
      <div className="kicker">Fin de jornada</div>
      <h1 className="h1 text-[30px]">Cierre del día</h1>
      <p className="lead">
        Tocá cada trabajo terminado para cerrarlo. Cada cierre vuelve acá para seguir con el siguiente.
      </p>
      {cerrada ? (
        <div className="rounded-sm bg-ok-bg px-[14px] py-3 text-sm text-ok-t">
          Orden #{String(cerrada).padStart(4, "0")} cerrada.
          {portfolio === "sinfotos" ? " No se publicó en Trabajos (faltan fotos)." : ""}
        </div>
      ) : null}
      {ordenes.length === 0 ? <Nota>No hay trabajos en proceso.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {ordenes.map((o) => (
          <Link
            key={o.id}
            href={`/taller/ordenes/${o.id}/cerrar?volver=cierre`}
            className="card flex items-center gap-3 p-[10px] no-underline text-ink"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="h3 text-[17px]">
                {o.instrumentos ? nombreInstrumento(o.instrumentos) : "Instrumento"} ·{" "}
                {o.tipos_trabajo?.nombre.toLowerCase() ?? "trabajo"}
              </span>
              <span className="mute">
                {numeroOrden(o.numero)} · {o.perfiles?.nombre ?? "—"}
              </span>
            </span>
            <EstadoPill estado={o.estado} />
            <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
          </Link>
        ))}
      </div>
    </Contenido>
  );
}
