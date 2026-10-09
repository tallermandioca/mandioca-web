import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
const { data, error } = await c.auth.signInWithPassword({ email: process.argv[2], password: process.argv[3] });
if (error) { console.error(error.message); process.exit(1); }
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const valor = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64url");
console.log(`sb-${ref}-auth-token=${valor}`);
