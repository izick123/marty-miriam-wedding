# Backend Setup

This site uses Supabase for the live wedding photo backend:

- Supabase Storage stores the image files.
- Supabase Postgres stores gallery metadata.
- Supabase Realtime pushes new photos to guests' browsers.

## What You Need

No Codex plugin is required.

You need:

- A free Supabase account
- One Supabase project
- The project URL
- The anon public key

Do not paste or commit the Supabase service role key. The frontend does not need it.

## Create The Backend

1. Go to Supabase and create a new project.
2. Open the SQL editor.
3. Paste and run `docs/supabase.sql`.
4. Go to **Database** -> **Replication** and confirm `wedding_photos` is enabled for realtime.
5. Go to **Storage** and confirm the `wedding-photos` bucket exists and is public.
6. Go to **Project Settings** -> **API**.
7. Copy the project URL and anon public key.
8. Add them to `src/config.js`.

```js
supabaseUrl: "https://YOUR_PROJECT.supabase.co",
supabaseAnonKey: "YOUR_ANON_PUBLIC_KEY",
```

## Optional Moderation

The current setup lets uploads appear immediately. For a wedding reception, that is the smoothest guest experience.

If you want moderation, change the `approved` default in `docs/supabase.sql` to `false`, then build a small admin page that flips `approved` to `true`.

## GitHub Pages

GitHub Pages is fine for the frontend. The backend lives in Supabase, so no server is needed on GitHub.
