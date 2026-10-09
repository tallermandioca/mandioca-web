/**
 * Database CLI for Supabase (no Docker / Supabase CLI needed).
 *
 *   npm run db:migrate   apply pending files from supabase/migrations in order
 *   npm run db:seed      run supabase/seed.sql (demo data)
 *   npm run db:reset     DEV ONLY: drop everything (supabase/reset.sql), migrate and seed
 *
 * Connection settings come from .env.local (SUPABASE_DB_*).
 */
import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });

const root = join(process.cwd(), "supabase");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable ${name} en .env.local`);
  }
  return value;
}

function connect() {
  return postgres({
    host: requireEnv("SUPABASE_DB_HOST"),
    port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
    user: requireEnv("SUPABASE_DB_USER"),
    password: requireEnv("SUPABASE_DB_PASSWORD"),
    database: process.env.SUPABASE_DB_NAME ?? "postgres",
    ssl: "require",
    max: 1,
    onnotice: () => undefined,
  });
}

type Sql = ReturnType<typeof connect>;

async function migrate(sql: Sql): Promise<void> {
  await sql.unsafe(`create table if not exists _migraciones (
    nombre text primary key,
    aplicada_at timestamptz not null default now()
  )`);
  await sql.unsafe("alter table _migraciones enable row level security");
  const applied = new Set(
    (await sql<{ nombre: string }[]>`select nombre from _migraciones`).map((r) => r.nombre),
  );
  const files = readdirSync(join(root, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = readFileSync(join(root, "migrations", file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into _migraciones (nombre) values (${file})`;
    });
    console.log(`aplicada ${file}`);
    count += 1;
  }
  console.log(count === 0 ? "sin migraciones pendientes" : `${count} migraciones aplicadas`);
}

async function runFile(sql: Sql, name: string): Promise<void> {
  const body = readFileSync(join(root, name), "utf8");
  await sql.unsafe(body);
  console.log(`ejecutado ${name}`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const sql = connect();
  try {
    switch (command) {
      case "migrate":
        await migrate(sql);
        break;
      case "seed":
        await runFile(sql, "seed.sql");
        break;
      case "reset":
        if (process.env.NODE_ENV === "production") {
          throw new Error("reset no se ejecuta en producción");
        }
        await runFile(sql, "reset.sql");
        await migrate(sql);
        await runFile(sql, "seed.sql");
        break;
      default:
        throw new Error("Uso: tsx scripts/db.ts <migrate|seed|reset>");
    }
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
