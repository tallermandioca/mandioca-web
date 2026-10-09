import { NextResponse, type NextRequest } from "next/server";
import {
  cifrar,
  descifrar,
  instagramConfigurado,
  obtenerUltimosPosts,
  refrescarToken,
} from "@/lib/instagram";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIAS_ANTES_DE_REFRESCAR = 10;

/**
 * Daily job: refreshes the Instagram token when it expires within 10 days and
 * re-caches the latest posts. Protected with CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!instagramConfigurado()) {
    return NextResponse.json({ estado: "sin_configurar" });
  }

  const supabase = crearClienteAdmin();
  const { data: config } = await supabase
    .from("configuracion")
    .select("ig_token_encriptado, ig_token_vence_at")
    .maybeSingle();
  if (!config?.ig_token_encriptado) {
    return NextResponse.json({ estado: "sin_conectar" });
  }

  let token: string;
  try {
    token = descifrar(config.ig_token_encriptado);
  } catch (e) {
    return NextResponse.json(
      { estado: "token_ilegible", detalle: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  let refrescado = false;
  const vence = config.ig_token_vence_at ? new Date(config.ig_token_vence_at) : null;
  if (!vence || vence.getTime() - Date.now() < DIAS_ANTES_DE_REFRESCAR * 86_400_000) {
    try {
      const nuevo = await refrescarToken(token);
      token = nuevo.token;
      await supabase
        .from("configuracion")
        .update({ ig_token_encriptado: cifrar(nuevo.token), ig_token_vence_at: nuevo.venceAt.toISOString() })
        .eq("id", true);
      refrescado = true;
    } catch (e) {
      // Keep going with the current token; the workshop sees the expiry date in Configuración.
      console.error("instagram refresh", e instanceof Error ? e.message : e);
    }
  }

  try {
    const posts = await obtenerUltimosPosts(token, 12);
    if (posts.length > 0) {
      await supabase.from("instagram_posts").upsert(posts, { onConflict: "ig_id" });
      // Keep the cache small: drop posts no longer among the latest ones.
      await supabase
        .from("instagram_posts")
        .delete()
        .not("ig_id", "in", `(${posts.map((p) => `"${p.ig_id}"`).join(",")})`);
    }
    return NextResponse.json({ estado: "ok", posts: posts.length, refrescado });
  } catch (e) {
    return NextResponse.json(
      { estado: "error_posts", detalle: e instanceof Error ? e.message : String(e), refrescado },
      { status: 502 },
    );
  }
}
