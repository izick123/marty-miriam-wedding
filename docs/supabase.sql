create extension if not exists pgcrypto;

create table if not exists public.wedding_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text not null unique,
  guest_name text,
  note text,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  constraint guest_name_length check (guest_name is null or char_length(guest_name) <= 80),
  constraint note_length check (note is null or char_length(note) <= 120),
  constraint storage_path_shape check (storage_path ~ '^[0-9]+-[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|heic)$')
);

create index if not exists wedding_photos_created_at_idx
  on public.wedding_photos (created_at desc);

alter table public.wedding_photos enable row level security;

drop policy if exists "Anyone can view wedding photos" on public.wedding_photos;
drop policy if exists "Anyone can add wedding photos" on public.wedding_photos;
drop policy if exists "Anyone can upload wedding photos" on storage.objects;
drop policy if exists "Anyone can view wedding photos" on storage.objects;

create policy "Anyone can view wedding photos"
  on public.wedding_photos
  for select
  using (approved = true);

create policy "Anyone can add wedding photos"
  on public.wedding_photos
  for insert
  with check (
    approved = true
    and image_url like 'https://%'
    and storage_path ~ '^[0-9]+-[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|heic)$'
  );

insert into storage.buckets (id, name, public)
values ('wedding-photos', 'wedding-photos', true)
on conflict (id) do update set public = true;

create policy "Anyone can upload wedding photos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'wedding-photos'
    and (
      lower(right(name, 4)) in ('.jpg', '.png', '.gif')
      or lower(right(name, 5)) in ('.jpeg', '.webp', '.heic')
    )
  );

create policy "Anyone can view wedding photos"
  on storage.objects
  for select
  using (bucket_id = 'wedding-photos');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wedding_photos'
  ) then
    alter publication supabase_realtime add table public.wedding_photos;
  end if;
end $$;
