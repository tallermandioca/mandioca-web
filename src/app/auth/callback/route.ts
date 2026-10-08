import { NextResponse, type NextRequest } from "next/server";
import { destinoPorRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Magic link / invitation landing: exchanges the code for a session and sends the user to their area. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const volver = searchParams.get("volver");
  const destinoVolver = volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : null;

  if (!code) {
    return NextResponse.redirect(`${origin}/ingreso?error=link`);
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
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

  return NextResponse.redirect(`${origin}${destinoVolver ?? destinoPorRol(perfil?.rol)}`);
}
