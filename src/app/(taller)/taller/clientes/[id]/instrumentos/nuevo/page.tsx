import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { requerirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioInstrumento } from "../../../FormularioInstrumento";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nuevo instrumento" };

export default async function NuevoInstrumento({
  params,
}: PageProps<"/taller/clientes/[id]/instrumentos/nuevo">) {
  await requerirRol("admin", "/taller/clientes");
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: cliente } = await supabase.from("perfiles").select("id, nombre").eq("id", id).maybeSingle();
  if (!cliente) notFound();

  return (
    <Contenido>
      <Link
        href={`/taller/clientes/${cliente.id}`}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> {cliente.nombre}
      </Link>
      <h1 className="h1 text-[30px]">Nuevo instrumento</h1>
      <p className="lead">
        Mínimo: tipo, marca o modelo, y una foto del número de serie. El resto se completa después.
      </p>
      <FormularioInstrumento valores={{ dueno_id: cliente.id }} />
    </Contenido>
  );
}
