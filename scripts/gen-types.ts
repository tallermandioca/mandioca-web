/** Regenerates src/lib/supabase/types.ts from the live database (uses the connection in .env.local). */
import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ path: ".env.local" });

const {
  SUPABASE_DB_HOST,
  SUPABASE_DB_USER,
  SUPABASE_DB_PASSWORD,
  SUPABASE_DB_PORT = "5432",
  SUPABASE_DB_NAME = "postgres",
} = process.env;
if (!SUPABASE_DB_HOST || !SUPABASE_DB_USER || !SUPABASE_DB_PASSWORD) {
  throw new Error("Faltan SUPABASE_DB_HOST, SUPABASE_DB_USER o SUPABASE_DB_PASSWORD en .env.local");
}
const url = `postgresql://${encodeURIComponent(SUPABASE_DB_USER)}:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}`;
execSync(
  `npx --yes supabase@latest gen types typescript --db-url "${url}" --schema public > src/lib/supabase/types.ts`,
  { stdio: "inherit", shell: "bash" },
);
execSync("npx prettier --write src/lib/supabase/types.ts", { stdio: "inherit" });
console.log("tipos regenerados en src/lib/supabase/types.ts");
