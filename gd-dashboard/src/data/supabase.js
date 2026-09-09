import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseAtivo = Boolean(url && key);
export const supabase = supabaseAtivo ? createClient(url, key) : null;
export const BUCKET_LOGOS = "logos";
