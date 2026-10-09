import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { destinoPorRol, destinoSeguro } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

const TIPOS_OTP: EmailOtpType[] = ["magiclink", "invite", "recovery", "email_change", "signup", "email"];

/**
 * Auth landing for email links.
 * - PKCE flow (same browser that asked for the link): ?code=...
 * - token_hash flow (invitations, links opened on another device): ?token_hash=...&type=...
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const volver = destinoSeguro(searchParams.get("volver"));

  const supabase = await crearClienteServidor();
  let fallo = true;
  if (code) {
    fallo = Boolean((await supabase.auth.exchangeCodeForSession(code)).error);
  } else if (tokenHash && tipo && TIPOS_OTP.includes(tipo)) {
    fallo = Boolean((await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })).error);
  }
  if (fallo) {
    return NextResponse.redirect(`${origin}/ingreso?error=link`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return NextResponse.redirect(`${origin}${volver ?? destinoPorRol(perfil?.rol)}`);
}
