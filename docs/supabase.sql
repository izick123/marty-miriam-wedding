create table if not exists public.wedding_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text not null,
  guest_name text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.wedding_photos enable row level security;

create policy "Anyone can view wedding photos"
  on public.wedding_photos
  for select
  using (true);

create policy "Anyone can add wedding photos"
  on public.wedding_photos
  for insert
  with check (true);

insert into storage.buckets (id, name, public)
values ('wedding-photos', 'wedding-photos', true)
on conflict (id) do update set public = true;

create policy "Anyone can upload wedding photos"
  on storage.objects
  for insert
  with check (bucket_id = 'wedding-photos');

create policy "Anyone can view wedding photos"
  on storage.objects
  for select
  using (bucket_id = 'wedding-photos');
