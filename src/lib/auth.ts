import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Rol = Database["public"]["Enums"]["rol_perfil"];

export interface Sesion {
  userId: string;
  email: string | null;
  perfil: {
    id: string;
    nombre: string;
    rol: Rol;
    whatsapp: string | null;
    email: string | null;
    canal_preferido: Database["public"]["Enums"]["canal_aviso"];
  } | null;
}

/** Current user + profile, memoised per request. Null when logged out. */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, whatsapp, email, canal_preferido")
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, perfil };
});

/** Redirects to /ingreso when logged out, or home when the role does not match. */
export async function requerirRol(
  rol: Rol | "cualquiera",
  volver: string,
): Promise<Sesion & { perfil: NonNullable<Sesion["perfil"]> }> {
  const sesion = await obtenerSesion();
  if (!sesion || !sesion.perfil) {
    redirect(`/ingreso?volver=${encodeURIComponent(volver)}`);
  }
  if (rol !== "cualquiera" && sesion.perfil.rol !== rol && sesion.perfil.rol !== "admin") {
    redirect("/");
  }
  return { ...sesion, perfil: sesion.perfil };
}

/** Where a user lands after logging in, by role. */
export function destinoPorRol(rol: Rol | undefined): string {
  return rol === "admin" ? "/taller" : "/mi-cuenta";
}
