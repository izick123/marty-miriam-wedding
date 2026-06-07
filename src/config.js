export const weddingConfig = {
  // Supabase is optional for local preview. Without these values, uploads use browser localStorage.
  supabaseUrl: "https://utafbbclwrfapgknrvhc.supabase.co",
  supabaseAnonKey: "sb_publishable_1DtgdQwlgPd3xufeQi4X8g_yHz2SnXC",
  supabaseTable: "wedding_photos",
  supabaseBucket: "wedding-photos",
  // This is a lightweight static-site admin gate. Change this before the wedding.
  adminPassword: "marty-miriam-admin",
  supabaseCdn: "https://esm.sh/@supabase/supabase-js@2"
};
