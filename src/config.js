export const weddingConfig = {
  // Supabase is optional for local preview. Without these values, uploads use browser localStorage.
  supabaseUrl: "https://utafbbclwrfapgknrvhc.supabase.co",
  supabaseAnonKey: "sb_publishable_1DtgdQwlgPd3xufeQi4X8g_yHz2SnXC",
  supabaseTable: "wedding_photos",
  supabaseBucket: "wedding-photos",
  // Default password is: marty-miriam-admin
  // This is a lightweight static-site admin gate. Change this hash before the wedding.
  adminPasswordHash: "1044453ebc0ada64eda18d99b8bda757821c1d5a5c0fb3d47b35dbdae5fcb7ef",
  supabaseCdn: "https://esm.sh/@supabase/supabase-js@2"
};
