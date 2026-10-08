import { Contenido } from "@/components/layout/Marco";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ESTADOS_ABIERTOS } from "@/lib/domain/ordenes";
import { formatearFechaLarga } from "@/lib/formato";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel del taller" };

export default async function PanelTaller() {
  await requerirRol("admin", "/taller");
  const supabase = await crearClienteServidor();
  const [{ count: abiertas }, { count: paraRetirar }] = await Promise.all([
    supabase
      .from("ordenes")
      .select("id", { count: "exact", head: true })
      .in("estado", [...ESTADOS_ABIERTOS]),
    supabase.from("ordenes").select("id", { count: "exact", head: true }).eq("estado", "listo"),
  ]);

  return (
    <Contenido>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="h1">Panel del día</h1>
          <div className="mute">{formatearFechaLarga(new Date())}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <div className="card flex flex-col px-3 py-[10px]">
          <b className="font-display text-[26px] font-extrabold leading-none">{abiertas ?? 0}</b>
          <span className="mute">abiertas</span>
        </div>
        <div className="card flex flex-col px-3 py-[10px]">
          <b className="font-display text-[26px] font-extrabold leading-none">{paraRetirar ?? 0}</b>
          <span className="mute">para retirar</span>
        </div>
      </div>
      <Nota>
        El panel completo del taller (nueva orden, cerrar trabajo, clientes, QR, plantillas) llega en la Fase
        2.
      </Nota>
    </Contenido>
  );
}
