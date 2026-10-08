import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Contenido } from "@/components/layout/Marco";
import { BotonEnlace } from "@/components/ui/Boton";
import { SITIO } from "@/config/sitio";
import { obtenerSesion } from "@/lib/auth";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Instrumento registrado" };

/**
 * QR label landing: /i/<qr_token>
 * admin  -> new order with the instrument preloaded
 * owner  -> the instrument sheet
 * anyone -> minimal public page, no data
 */
export default async function Qr({ params }: PageProps<"/i/[token]">) {
  const { token } = await params;
  if (!/^[a-z0-9-]{4,64}$/i.test(token)) notFound();

  // Service role only to resolve token -> id/owner; nothing else is read or shown.
  const admin = crearClienteAdmin();
  const { data: instrumento } = await admin
    .from("instrumentos")
    .select("id, dueno_id")
    .eq("qr_token", token)
    .maybeSingle();
  if (!instrumento) notFound();

  const sesion = await obtenerSesion();
  if (sesion?.perfil?.rol === "admin") redirect(`/taller/ordenes/nueva?instrumento=${instrumento.id}`);
  if (sesion?.perfil?.id === instrumento.dueno_id) redirect(`/mi-cuenta/instrumentos/${instrumento.id}`);

  return (
    <Contenido>
      <div className="h-[30px]" />
      <Image
        src="/logo-mandioca.png"
        alt=""
        width={110}
        height={110}
        className="size-[110px] self-center rounded-full bg-white"
        priority
      />
      <h1 className="h1 text-center">Instrumento registrado</h1>
      <p className="lead text-center">Este instrumento tiene su ficha e historial en el {SITIO.nombre}.</p>
      <p className="mute text-center">Si sos el dueño, ingresá a tu cuenta para ver la ficha.</p>
      <BotonEnlace href={`/ingreso?volver=${encodeURIComponent(`/i/${token}`)}`}>Ingresar</BotonEnlace>
      <BotonEnlace href="/" variante="borde">
        Ir al sitio del taller
      </BotonEnlace>
    </Contenido>
  );
}
