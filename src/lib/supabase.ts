import { createClient } from "@supabase/supabase-js";

export function supabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  return raw.replace("yednoggdlhokowqddznht", "yednogdlhokowqddznht");
}

export function db() {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function authClient() {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
