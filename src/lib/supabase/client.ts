"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseEnv } from "./env";

/** Browser client. One instance per page lifetime. */
export function crearClienteNavegador() {
  const { url, key } = supabaseEnv();
  return createBrowserClient<Database>(url, key);
}
