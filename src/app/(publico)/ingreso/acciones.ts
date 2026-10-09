"use server";

import { redirect } from "next/navigation";
import { SITIO } from "@/config/sitio";
import { destinoPorRol, destinoSeguro } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface EstadoIngreso {
  error?: string;
  mensaje?: string;
}

function urlCallback(volver: string | null): string {
  return `${SITIO.url}/auth/callback${volver ? `?volver=${encodeURIComponent(volver)}` : ""}`;
}

/** Google OAuth (PKCE). The verifier cookie is set here, so the callback must run in the same browser. */
export async function ingresarConGoogle(formData: FormData): Promise<void> {
  const volver = destinoSeguro(formData.get("volver"));
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: urlCallback(volver), skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    redirect("/ingreso?error=google");
  }
  redirect(data.url);
}

export async function enviarLinkDeIngreso(
  _estado: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return { error: "Escribí tu email para mandarte el link." };

  const volver = destinoSeguro(formData.get("volver"));
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: urlCallback(volver) },
  });
  if (error) {
    return { error: "No pudimos mandar el link. Probá de nuevo en un minuto." };
  }
  return {
    mensaje:
      "Listo. Revisá tu email y tocá el link para entrar. Si es tu primera vez, la cuenta se crea sola.",
  };
}

/** Password login, kept for the workshop account. */
export async function ingresarConContrasena(
  _estado: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá el email y la contraseña." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, estado")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  redirect(destinoSeguro(formData.get("volver")) ?? destinoPorRol(perfil));
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
