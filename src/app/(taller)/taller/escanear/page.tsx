import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { EscanerQr } from "@/components/taller/EscanerQr";
import { requerirRol } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Escanear QR" };

export default async function Escanear() {
  await requerirRol("admin", "/taller/escanear");
  return (
    <Contenido>
      <Link
        href="/taller"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 font-semibold no-underline text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden /> Panel
      </Link>
      <h1 className="h1 text-[30px]">Escanear QR</h1>
      <p className="lead">
        Apuntá a la etiqueta del instrumento. Abre la nueva orden con el cliente y el instrumento cargados.
      </p>
      <EscanerQr />
    </Contenido>
  );
}
