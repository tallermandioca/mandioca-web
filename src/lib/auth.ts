import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export { destinoSeguro } from "./redirect";

export type Rol = Database["public"]["Enums"]["rol_perfil"];
export type EstadoPerfil = Database["public"]["Enums"]["estado_perfil"];

export interface Perfil {
  id: string;
  nombre: string;
  rol: Rol;
  estado: EstadoPerfil;
  whatsapp: string | null;
  email: string | null;
  avatar_url: string | null;
  canal_preferido: Database["public"]["Enums"]["canal_aviso"];
}

export interface Sesion {
  userId: string;
  email: string | null;
  perfil: Perfil | null;
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
    .select("id, nombre, rol, estado, whatsapp, email, avatar_url, canal_preferido")
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, perfil };
});

/**
 * Guard for protected areas.
 * Logged out -> /ingreso. Pending or blocked profile -> /cuenta-pendiente.
 * Wrong role -> home. Admin passes everywhere.
 */
export async function requerirRol(
  rol: Rol | "cualquiera",
  volver: string,
): Promise<Sesion & { perfil: Perfil }> {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect(`/ingreso?volver=${encodeURIComponent(volver)}`);
  }
  if (!sesion.perfil || sesion.perfil.estado !== "activo") {
    redirect("/cuenta-pendiente");
  }
  if (rol !== "cualquiera" && sesion.perfil.rol !== rol && sesion.perfil.rol !== "admin") {
    redirect("/");
  }
  return { ...sesion, perfil: sesion.perfil };
}

/** Where a user lands after logging in, by role and state. */
export function destinoPorRol(perfil: { rol: Rol; estado: EstadoPerfil } | null | undefined): string {
  if (!perfil || perfil.estado !== "activo") return "/cuenta-pendiente";
  return perfil.rol === "admin" ? "/taller" : "/mi-cuenta";
}
