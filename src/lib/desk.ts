import { createClient } from "@supabase/supabase-js";
export async function deskRows(table: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from(table).select("*").limit(20);
  return data || [];
}
