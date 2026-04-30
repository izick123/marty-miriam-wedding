# Marty & Miriam Wedding Website

Elegant red-themed wedding site for Marty and Miriam's June 14, 2026 celebration at The Loft and Chapel at Cedar Ridge in Waukesha, Wisconsin.

The site includes:

- wedding details
- Chinese red-and-gold styling with subtle Jewish celebration notes and a custom hero visual
- guest photo upload form
- live gallery
- QR code for reception signs
- optional link to the couple's existing RSVP and gifts site
- local preview mode with `localStorage`
- Supabase production wiring for real-time uploads

## Run Locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Real-Time Photo Uploads

The site works locally without a backend, but production live uploads require Supabase.

1. Create a Supabase project.
2. Run `docs/supabase.sql` in the Supabase SQL editor.
3. In Supabase, enable Realtime for the `wedding_photos` table.
4. Add your project URL and anon key in `src/config.js`.
5. Set `existingWeddingSiteUrl` in `src/config.js` if they want this site to link back to the RSVP and gifts site.
6. Deploy the site.
7. Set `deployedUrl` in `src/config.js` to the final public URL so the QR code points guests to the upload form.

## Suggested Deployment

This is a plain static site, so Vercel, Netlify, GitHub Pages, or Cloudflare Pages all work.

For GitHub Pages, deploy the repository root and use `index.html` as the entry point.

## Notes

The public anon key is safe to expose only with the row-level security policies in `docs/supabase.sql`. For tighter control, add a private upload code or moderation flow before the wedding.
