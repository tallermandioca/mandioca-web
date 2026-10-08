/**
 * Creates the demo Auth users that match the profiles in supabase/seed.sql.
 * The auth trigger (fn_auth_user_creado) links each new user to its profile by email.
 *
 *   npm run seed:usuarios
 *
 * Demo password for every account: mandioca123
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const DEMO_PASSWORD = "mandioca123";

const usuarios = [
  { email: "tallermandioca.dev@gmail.com", nombre: "Taller Mandioca" },
  { email: "martin@demo.mandioca.ar", nombre: "Martín Suárez" },
  { email: "lucia@demo.mandioca.ar", nombre: "Lucía Pérez" },
  { email: "jorge@demo.mandioca.ar", nombre: "Jorge Ramírez" },
  { email: "sofia@demo.mandioca.ar", nombre: "Sofía Martínez" },
  { email: "ana@demo.mandioca.ar", nombre: "Ana García" },
  { email: "lucas@demo.mandioca.ar", nombre: "Lucas Díaz" },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name} en .env.local`);
  return value;
}

async function main(): Promise<void> {
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const byEmail = new Map(existing.users.map((u) => [u.email?.toLowerCase(), u.id]));

  for (const usuario of usuarios) {
    const id = byEmail.get(usuario.email);
    if (id) {
      // Re-link in case the profiles were re-seeded (seed.sql resets user_id).
      const { error } = await supabase
        .from("perfiles")
        .update({ user_id: id })
        .eq("email", usuario.email)
        .is("user_id", null);
      if (error) throw error;
      console.log(`ya existía ${usuario.email}`);
      continue;
    }
    const { error } = await supabase.auth.admin.createUser({
      email: usuario.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { nombre: usuario.nombre },
    });
    if (error) throw error;
    console.log(`creado ${usuario.email}`);
  }

  const { data: perfiles, error } = await supabase.from("perfiles").select("email, rol, user_id");
  if (error) throw error;
  const sinVincular = perfiles.filter((p) => p.user_id === null);
  if (sinVincular.length > 0) {
    console.warn("Perfiles sin usuario:", sinVincular.map((p) => p.email).join(", "));
  }
  console.log(`listo: ${perfiles.length} perfiles, contraseña demo "${DEMO_PASSWORD}"`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
