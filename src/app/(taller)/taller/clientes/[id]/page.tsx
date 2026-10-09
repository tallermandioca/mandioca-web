import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { ItemOrden } from "@/components/taller/Ordenes";
import { BotonEnlace } from "@/components/ui/Boton";
import { Nota, Pill, PuntoSemaforo } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";
import { clienteConTodo } from "@/lib/datos/taller";
import { ETIQUETA_SEMAFORO, semaforo } from "@/lib/domain/revision";
import { fechaDesdeIso, formatearFecha, nombreInstrumento } from "@/lib/formato";
import { hoyArgentina } from "@/lib/hoy";
import { linkWhatsapp } from "@/lib/notificaciones/whatsapp";
import { FormularioCliente } from "../FormularioCliente";

export const dynamic = "force-dynamic";

export default async function FichaCliente({ params }: PageProps<"/taller/clientes/[id]">) {
  await requerirRol("admin", "/taller/clientes");
  const { id } = await params;
  const datos = await clienteConTodo(id);
  if (!datos) notFound();
  const { cliente, instrumentos, ordenes } = datos;
  const hoy = hoyArgentina();
  const wa = linkWhatsapp(
    cliente.whatsapp,
    `Hola ${cliente.nombre.split(" ")[0]}! Te escribimos del Taller Mandioca.`,
  );

  return (
    <Contenido>
      <Link
        href="/taller/clientes"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Clientes
      </Link>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="h1 text-[30px]">{cliente.nombre}</h1>
          <div className="mute">
            {cliente.whatsapp ?? "sin WhatsApp"}
            {cliente.email ? ` · ${cliente.email}` : ""}
          </div>
        </div>
        {cliente.estado === "pendiente" ? <Pill tono="warn">Pendiente</Pill> : null}
        {cliente.estado === "bloqueado" ? <Pill tono="red">Bloqueado</Pill> : null}
        {cliente.estado === "activo" && !cliente.user_id ? <Pill tono="mute">Sin cuenta</Pill> : null}
        {cliente.estado === "activo" && cliente.user_id ? <Pill tono="ok">Con cuenta</Pill> : null}
      </div>
      <div className="flex gap-2">
        <BotonEnlace href={`/taller/ordenes/nueva?cliente=${cliente.id}`} tamano="chico" className="flex-1">
          Nueva orden
        </BotonEnlace>
        {wa ? (
          <BotonEnlace href={wa} externo variante="borde" tamano="chico" className="flex-1">
            WhatsApp
          </BotonEnlace>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="h2">Instrumentos</h2>
        <Link
          href={`/taller/clientes/${cliente.id}/instrumentos/nuevo`}
          className="text-[13px] font-semibold text-red no-underline"
        >
          + Agregar
        </Link>
      </div>
      {instrumentos.length === 0 ? <Nota>Todavía no tiene instrumentos cargados.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {instrumentos.map((i) => {
          const estado = semaforo(fechaDesdeIso(i.proxima_revision), hoy);
          return (
            <Link
              key={i.id}
              href={`/taller/instrumentos/${i.id}`}
              className="card flex items-center gap-3 p-[10px] no-underline text-ink"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="h3 text-[17px]">{nombreInstrumento(i)}</span>
                <span className="mute">
                  {i.numero_serie ? `N° ${i.numero_serie} · ` : ""}QR {i.qr_token}
                </span>
                <PuntoSemaforo estado={estado}>
                  {ETIQUETA_SEMAFORO[estado]}
                  {i.proxima_revision ? ` · ${formatearFecha(i.proxima_revision)}` : ""}
                </PuntoSemaforo>
              </span>
              <ChevronRight className="size-5 shrink-0 text-mute" aria-hidden />
            </Link>
          );
        })}
      </div>

      <h2 className="h2">Órdenes</h2>
      {ordenes.length === 0 ? <Nota>Sin órdenes.</Nota> : null}
      <div className="flex flex-col gap-[10px]">
        {ordenes.map((o) => (
          <ItemOrden key={o.id} orden={o} hoy={hoy} />
        ))}
      </div>

      <details className="card p-3">
        <summary className="cursor-pointer font-semibold">Editar datos del cliente</summary>
        <div className="pt-3">
          <FormularioCliente
            valores={{
              id: cliente.id,
              nombre: cliente.nombre,
              whatsapp: cliente.whatsapp,
              email: cliente.email,
              canal_preferido: cliente.canal_preferido,
            }}
          />
        </div>
      </details>
    </Contenido>
  );
}
