import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { EstadoPill, numeroOrden } from "@/components/taller/Ordenes";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { Nota } from "@/components/ui/Etiquetas";
import { SITIO } from "@/config/sitio";
import { requerirRol } from "@/lib/auth";
import { configuracion, ordenCompleta } from "@/lib/datos/taller";
import { ETIQUETA_ESTADO, siguientesEstados } from "@/lib/domain/ordenes";
import { formatearFecha, formatearImporte, nombreInstrumento } from "@/lib/formato";
import { linkWhatsapp, rellenarPlantilla } from "@/lib/notificaciones/whatsapp";
import { resolverFotos } from "@/lib/storage";
import { borrarFoto } from "./acciones";
import { FormularioDetalles, FormularioEstado, FormularioFotos } from "./FormulariosOrden";

export const dynamic = "force-dynamic";

const PLANTILLA_LISTO =
  "Hola {nombre}! Tu {instrumento} está listo para retirar. Orden #{numero}. Te esperamos en el taller.";
const PLANTILLA_RECIBIDO =
  "Hola {nombre}! Recibimos tu {instrumento} en el Taller Mandioca. Orden #{numero}. Podés seguirla desde tu cuenta: {link}";
const PLANTILLA_PRESUPUESTO =
  "Hola {nombre}! Ya tenemos el presupuesto de tu {instrumento} (orden #{numero}): {importe}. Podés aprobarlo desde tu cuenta: {link}";

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function DetalleOrden({ params, searchParams }: PageProps<"/taller/ordenes/[id]">) {
  await requerirRol("admin", "/taller/ordenes");
  const { id } = await params;
  const sp = await searchParams;
  const [orden, config] = await Promise.all([ordenCompleta(id), configuracion()]);
  if (!orden) notFound();

  const instrumento = orden.instrumentos ? nombreInstrumento(orden.instrumentos) : "instrumento";
  const cliente = orden.perfiles;
  const nombrePila = cliente?.nombre.split(" ")[0] ?? "";
  const numero = numeroOrden(orden.numero);
  const valores = {
    nombre: nombrePila,
    instrumento,
    numero: String(orden.numero).padStart(4, "0"),
    link: `${SITIO.url}/mi-cuenta`,
    importe: formatearImporte(orden.presupuesto),
  };
  const mensaje =
    orden.estado === "listo"
      ? rellenarPlantilla(config?.texto_aviso_listo?.trim() || PLANTILLA_LISTO, valores)
      : orden.estado === "presupuestado"
        ? rellenarPlantilla(PLANTILLA_PRESUPUESTO, valores)
        : rellenarPlantilla(PLANTILLA_RECIBIDO, valores);
  const wa = linkWhatsapp(cliente?.whatsapp, mensaje);

  const fotos = [...orden.fotos_orden].sort((a, b) => a.orden - b.orden);
  const urls = await resolverFotos(fotos.map((f) => f.url));
  const siguientes = siguientesEstados(orden.estado, orden.tipos_trabajo?.requiere_presupuesto === false);
  const creada = primero(sp.creada) === "1";
  const cerrada = Boolean(primero(sp.cerrada));
  const portfolio = primero(sp.portfolio);
  const volverCierre = primero(sp.volver) === "cierre";

  return (
    <Contenido>
      <Link
        href={volverCierre ? "/taller/cierre" : "/taller"}
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> {volverCierre ? "Cierre del día" : "Panel"}
      </Link>

      {creada || cerrada ? (
        <div className="rounded-sm bg-ok-bg px-[14px] py-3 text-sm text-ok-t">
          {creada ? `Orden ${numero} creada.` : `Orden ${numero} cerrada: lista para retirar.`}{" "}
          {orden.avisar_cliente && wa ? "Mandale el WhatsApp con el botón de abajo." : ""}
        </div>
      ) : null}
      {portfolio === "sinfotos" ? (
        <Nota>
          No se publicó en Trabajos: la galería necesita foto del antes y del después. Subilas acá y volvé a
          cerrar desde la edición si querés publicarlo.
        </Nota>
      ) : null}
      {portfolio === "errorfotos" || portfolio === "errorportfolio" ? (
        <Nota>
          La orden se cerró, pero no se pudo publicar en Trabajos. Probá de nuevo más tarde desde
          Configuración.
        </Nota>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="kicker">
            {numero} · {orden.tipos_trabajo?.nombre ?? "Trabajo"}
          </div>
          <h1 className="h1 text-[28px]">{instrumento}</h1>
          <div className="mute">
            <Link href={`/taller/clientes/${cliente?.id}`} className="font-semibold text-ink">
              {cliente?.nombre}
            </Link>{" "}
            · ingresó el {formatearFecha(orden.fecha_ingreso)}
            {orden.fecha_estimada ? ` · estimado ${formatearFecha(orden.fecha_estimada)}` : ""}
          </div>
        </div>
        <EstadoPill estado={orden.estado} />
      </div>

      {wa && orden.estado !== "entregado" && orden.estado !== "cancelado" ? (
        <BotonEnlace href={wa} externo>
          {orden.estado === "listo"
            ? "Avisar que está listo por WhatsApp"
            : orden.estado === "presupuestado"
              ? "Mandar presupuesto por WhatsApp"
              : "Avisar al cliente por WhatsApp"}
        </BotonEnlace>
      ) : null}
      {!cliente?.whatsapp ? <Nota>El cliente no tiene WhatsApp cargado.</Nota> : null}

      {orden.estado !== "listo" && orden.estado !== "entregado" && orden.estado !== "cancelado" ? (
        <BotonEnlace href={`/taller/ordenes/${orden.id}/cerrar`} variante="oscuro">
          Cerrar trabajo
        </BotonEnlace>
      ) : null}

      <section className="card flex flex-col gap-2 p-3">
        <h2 className="h3">Estado</h2>
        <div className="mute">
          Ahora: <b className="text-ink">{ETIQUETA_ESTADO[orden.estado]}</b>
        </div>
        {siguientes.length > 0 ? <FormularioEstado ordenId={orden.id} siguientes={siguientes} /> : null}
      </section>

      <FormularioDetalles
        ordenId={orden.id}
        estado={orden.estado}
        pedido={orden.pedido_cliente}
        presupuesto={orden.presupuesto}
        fechaEstimada={orden.fecha_estimada}
        importe={orden.importe}
        detalle={orden.detalle_realizado}
        cuerdas={orden.cuerdas_puestas}
        proximaRevision={orden.proxima_revision}
        notas={orden.notas_internas_orden?.texto ?? ""}
      />

      <section className="card flex flex-col gap-2 p-3">
        <h2 className="h3">Fotos</h2>
        {fotos.length === 0 ? <div className="mute">Todavía no hay fotos.</div> : null}
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="flex flex-col gap-1">
              <Foto
                url={urls.get(f.url) ?? null}
                alt={`Foto ${f.momento}`}
                className="aspect-square"
                sizes="150px"
              />
              <div className="flex items-center justify-between">
                <span className="mute">{f.momento === "antes" ? "Antes" : "Después"}</span>
                <form action={borrarFoto}>
                  <input type="hidden" name="id" value={orden.id} />
                  <input type="hidden" name="foto_id" value={f.id} />
                  <button type="submit" className="text-xs font-semibold text-mute">
                    Quitar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <FormularioFotos ordenId={orden.id} />
      </section>
    </Contenido>
  );
}
