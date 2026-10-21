import { createClient } from "@supabase/supabase-js";

// The hosted project ref is yednogdlhokowqddznht. A deployed NEXT_PUBLIC_SUPABASE_URL
// has been seen with an extra "g" (yednoggd…). Rewrite that one misspelling so the
// site still reaches the project. Set the env var to https://yednogdlhokowqddznht.supabase.co.
export function supabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  return raw.replace("yednoggdlhokowqddznht", "yednogdlhokowqddznht").replace(/\/$/, "");
}

export function db() {
  return serviceDb();
}

export function liveDataAllowed() {
  return process.env.VERCEL_ENV !== "preview";
}

export function serviceDb() {
  if (typeof window !== "undefined") return null;
  if (!liveDataAllowed()) return null;
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function authClient() {
  if (!liveDataAllowed()) return null;
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
