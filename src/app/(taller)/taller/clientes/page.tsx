import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { Nota, Pill } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { buscarClientes } from "@/lib/datos/taller";
import { nombreInstrumento } from "@/lib/formato";

export const dynamic = "force-dynamic";

export const metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: PageProps<"/taller/clientes">) {
  await requerirRol("admin", "/taller/clientes");
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const clientes = await buscarClientes(q);

  return (
    <Contenido>
      <div className="flex items-end justify-between">
        <h1 className="h1 text-[30px]">Clientes</h1>
        <BotonEnlace href="/taller/clientes/nuevo" tamano="chico" variante="oscuro">
          + Nuevo
        </BotonEnlace>
      </div>
      <form method="get" action="/taller/clientes" className="flex items-end gap-2">
        <label className="field flex-1">
          Buscar por nombre, WhatsApp, instrumento o número de serie
          <input name="q" defaultValue={q} placeholder="Martín, Telecaster, S812345…" autoFocus={!q} />
        </label>
        <button
          type="submit"
          aria-label="Buscar"
          className="flex size-[46px] items-center justify-center rounded-md bg-ink text-paper"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </form>
      {clientes.length === 0 ? <Nota>No encontramos clientes con ese dato.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {clientes.map((c) => (
          <Link
            key={c.id}
            href={`/taller/clientes/${c.id}`}
            className="card flex items-center gap-3 p-[10px] no-underline text-ink"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-paper">
              {c.nombre.trim().charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{c.nombre}</span>
              <span className="mute truncate">
                {c.whatsapp ?? "sin WhatsApp"} ·{" "}
                {c.instrumentos.length === 0
                  ? "sin instrumentos"
                  : c.instrumentos.map((i) => nombreInstrumento(i)).join(", ")}
              </span>
            </span>
            {c.estado === "pendiente" ? <Pill tono="warn">Pendiente</Pill> : null}
            {c.estado === "bloqueado" ? <Pill tono="red">Bloqueado</Pill> : null}
            {c.estado === "activo" && !c.user_id ? <Pill tono="mute">Sin cuenta</Pill> : null}
            <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
          </Link>
        ))}
      </div>
    </Contenido>
  );
}
