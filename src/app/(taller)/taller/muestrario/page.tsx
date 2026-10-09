import { Contenido } from "@/components/layout/Marco";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearImporte } from "@/lib/formato";
import { Pill } from "@/components/ui/Etiquetas";

export const dynamic = "force-dynamic";

export const metadata = { title: "Muestrario" };

const ETIQUETA: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  pausada: "Pausada",
  vendida: "Vendida",
};

export default async function MuestrarioTaller() {
  await requerirRol("admin", "/taller/muestrario");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("publicaciones_venta")
    .select(
      "id, titulo, precio, moneda, estado, revisado_por_taller, perfiles!publicaciones_venta_vendedor_id_fkey(nombre)",
    )
    .order("created_at", { ascending: false });

  return (
    <Contenido>
      <h1 className="h1 text-[30px]">Muestrario</h1>
      <p className="lead">
        Publicaciones de los clientes. Aprobar, pausar y poner el sello llega en la Fase 5.
      </p>
      {(data ?? []).length === 0 ? <Nota>No hay publicaciones.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {(data ?? []).map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{p.titulo}</span>
              <span className="mute">
                {p.perfiles?.nombre ?? "—"} · {formatearImporte(p.precio, p.moneda)}
                {p.revisado_por_taller ? " · con sello" : ""}
              </span>
            </span>
            <Pill tono={p.estado === "publicada" ? "ok" : p.estado === "borrador" ? "warn" : "mute"}>
              {ETIQUETA[p.estado] ?? p.estado}
            </Pill>
          </div>
        ))}
      </div>
    </Contenido>
  );
}
