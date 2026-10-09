import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { obtenerSesion } from "@/lib/auth";
import { instagramConfigurado, urlAutorizacion } from "@/lib/instagram";

export const dynamic = "force-dynamic";

/** Starts the Instagram OAuth flow. Admin only. */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (sesion?.perfil?.rol !== "admin" || sesion.perfil.estado !== "activo") {
    return NextResponse.redirect(
      new URL("/ingreso?volver=%2Ftaller%2Fconfiguracion", request.nextUrl.origin),
    );
  }
  if (!instagramConfigurado()) {
    return NextResponse.redirect(
      new URL("/taller/configuracion?instagram=sin_configurar", request.nextUrl.origin),
    );
  }
  const state = randomBytes(16).toString("hex");
  const respuesta = NextResponse.redirect(urlAutorizacion(state));
  respuesta.cookies.set("ig_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
    path: "/",
  });
  return respuesta;
}
