import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { canjearCodigo, cifrar, instagramConfigurado, obtenerUltimosPosts } from "@/lib/instagram";
import { crearClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Instagram sends the admin back here with ?code. Stores the encrypted long-lived token and fills the cache. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const volver = (motivo: string) =>
    NextResponse.redirect(new URL(`/taller/configuracion?instagram=${motivo}`, origin));

  const sesion = await obtenerSesion();
  if (sesion?.perfil?.rol !== "admin" || sesion.perfil.estado !== "activo") return volver("no_admin");
  if (!instagramConfigurado()) return volver("sin_configurar");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const esperado = request.cookies.get("ig_state")?.value;
  if (!code || !state || !esperado || state !== esperado) return volver("estado_invalido");

  try {
    const { token, venceAt } = await canjearCodigo(code);
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("configuracion")
      .upsert({ id: true, ig_token_encriptado: cifrar(token), ig_token_vence_at: venceAt.toISOString() });
    if (error) return volver("error_guardar");

    // First fill of the cache so the home page shows posts right away.
    const posts = await obtenerUltimosPosts(token, 12);
    if (posts.length > 0) {
      await supabase.from("instagram_posts").upsert(posts, { onConflict: "ig_id" });
    }
    const respuesta = volver("ok");
    respuesta.cookies.delete("ig_state");
    return respuesta;
  } catch (e) {
    console.error("instagram callback", e instanceof Error ? e.message : e);
    return volver("error_token");
  }
}
