import { Contenido } from "@/components/layout/Marco";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { TarjetaPendiente, type ClienteExistente, type Pendiente } from "./TarjetaPendiente";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cuentas nuevas" };

export default async function Cuentas() {
  await requerirRol("admin", "/taller/cuentas");
  const supabase = await crearClienteServidor();
  const [{ data: pendientes }, { data: clientes }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("id, nombre, email, whatsapp, created_at")
      .eq("estado", "pendiente")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("perfiles")
      .select("id, nombre, email, whatsapp, user_id, instrumentos(id)")
      .eq("rol", "cliente")
      .eq("estado", "activo")
      .is("user_id", null)
      .order("nombre"),
  ]);

  const existentes: ClienteExistente[] = (clientes ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    whatsapp: c.whatsapp,
    instrumentos: c.instrumentos.length,
  }));

  return (
    <Contenido>
      <div className="kicker">Cuentas</div>
      <h1 className="h1 text-[30px]">Cuentas nuevas</h1>
      <p className="lead">Clientes que entraron con Google o email y esperan que los vincules a su ficha.</p>
      {(pendientes ?? []).length === 0 ? (
        <Nota>No hay cuentas pendientes.</Nota>
      ) : (
        (pendientes as Pendiente[]).map((p) => (
          <TarjetaPendiente key={p.id} pendiente={p} clientes={existentes} />
        ))
      )}
      <Nota>
        &quot;Es un cliente que ya tengo&quot; muestra solo clientes sin cuenta vinculada. Si no aparece, es
        porque ya tiene otra cuenta.
      </Nota>
    </Contenido>
  );
}
