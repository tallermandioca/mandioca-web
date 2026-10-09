import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { requerirRol } from "@/lib/auth";
import { buscarClientes, tiposTrabajo } from "@/lib/datos/taller";
import { formatearFecha } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioNuevaOrden } from "./FormularioNuevaOrden";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nueva orden" };

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function NuevaOrden({ searchParams }: PageProps<"/taller/ordenes/nueva">) {
  await requerirRol("admin", "/taller/ordenes/nueva");
  const sp = await searchParams;
  const q = primero(sp.q) ?? "";
  let clienteId = primero(sp.cliente) ?? null;
  let instrumentoId = primero(sp.instrumento) ?? null;

  const supabase = await crearClienteServidor();
  if (instrumentoId && !clienteId) {
    const { data } = await supabase
      .from("instrumentos")
      .select("dueno_id")
      .eq("id", instrumentoId)
      .maybeSingle();
    clienteId = data?.dueno_id ?? null;
    if (!clienteId) instrumentoId = null;
  }

  const [tipos, resultados] = await Promise.all([tiposTrabajo(), q || !clienteId ? buscarClientes(q) : []]);
  let seleccionado = resultados.find((c) => c.id === clienteId) ?? null;
  if (clienteId && !seleccionado) {
    const encontrados = await buscarClientes("");
    seleccionado = encontrados.find((c) => c.id === clienteId) ?? null;
  }

  return (
    <Contenido className="pb-28">
      <Link
        href="/taller"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Panel
      </Link>
      <div>
        <h1 className="h1 text-[26px]">Nueva orden</h1>
        <div className="mute">un solo paso · hoy {formatearFecha(hoyArgentina())}</div>
      </div>
      <form id="buscar" method="get" action="/taller/ordenes/nueva" />
      <FormularioNuevaOrden
        q={q}
        resultados={q ? resultados : []}
        seleccionado={seleccionado}
        instrumentoInicial={instrumentoId}
        tipos={tipos.map((t) => ({
          id: t.id,
          nombre: t.nombre,
          requiere_presupuesto: t.requiere_presupuesto,
        }))}
      />
    </Contenido>
  );
}
