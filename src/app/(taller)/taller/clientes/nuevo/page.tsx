import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { requerirRol } from "@/lib/auth";
import { FormularioCliente } from "../FormularioCliente";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nuevo cliente" };

export default async function NuevoCliente() {
  await requerirRol("admin", "/taller/clientes/nuevo");
  return (
    <Contenido>
      <Link
        href="/taller/clientes"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Clientes
      </Link>
      <h1 className="h1 text-[30px]">Nuevo cliente</h1>
      <p className="lead">
        Con nombre y WhatsApp alcanza. Si después entra con Google con el mismo email, se vincula solo.
      </p>
      <FormularioCliente />
    </Contenido>
  );
}
