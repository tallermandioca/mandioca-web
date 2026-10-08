"use server";

import { redirect } from "next/navigation";
import { SITIO } from "@/config/sitio";
import { destinoPorRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface EstadoIngreso {
  error?: string;
  mensaje?: string;
}

function destinoSeguro(volver: FormDataEntryValue | null): string | null {
  if (typeof volver !== "string" || !volver.startsWith("/") || volver.startsWith("//")) return null;
  return volver;
}

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
    .select("rol")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  redirect(destinoSeguro(formData.get("volver")) ?? destinoPorRol(perfil?.rol));
}

export async function enviarLinkDeIngreso(
  _estado: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Escribí tu email para mandarte el link." };

  const volver = destinoSeguro(formData.get("volver"));
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${SITIO.url}/auth/callback${volver ? `?volver=${encodeURIComponent(volver)}` : ""}`,
    },
  });
  if (error) {
    return {
      error:
        "No encontramos una cuenta con ese email. La cuenta la crea el taller cuando dejás un instrumento.",
    };
  }
  return { mensaje: "Listo. Revisá tu email y tocá el link para entrar." };
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
