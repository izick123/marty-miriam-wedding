export const weddingConfig = {
  coupleNames: "Marty & Miriam",
  weddingDate: "2026-06-14T16:00:00-05:00",
  venueName: "The Loft and Chapel at Cedar Ridge",
  venueLocation: "Waukesha, Wisconsin",
  existingWeddingSiteUrl: "",

  // Replace this with the final deployed URL so the QR code works from printed signs.
  deployedUrl: "",

  // Supabase is optional for local preview. Without these values, uploads use browser localStorage.
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseTable: "wedding_photos",
  supabaseBucket: "wedding-photos",
  supabaseCdn: "https://esm.sh/@supabase/supabase-js@2"
};
