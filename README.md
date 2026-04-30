# Marty & Miriam Wedding Website

Live wedding photo upload site for Marty and Miriam's June 14, 2026 celebration.

The site includes:

- guest photo upload form
- live gallery
- guest photo downloads
- admin page for deleting uploads and exporting a photo list
- full-screen wedding background image
- local preview mode with `localStorage`
- Supabase production wiring for real-time uploads

## Run Locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Real-Time Photo Uploads

The site works locally without a backend, but production live uploads require Supabase.

See `docs/backend-setup.md` for the full backend setup.

## Suggested Deployment

This is a plain static site, so Vercel, Netlify, GitHub Pages, or Cloudflare Pages all work.

For GitHub Pages, deploy the repository root and use `index.html` as the entry point.

## Notes

The public anon key is safe to expose only with the row-level security policies in `docs/supabase.sql`. For tighter control, add a private upload code or moderation flow before the wedding.
