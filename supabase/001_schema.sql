-- Supabase schema for the Solbo production migration.
-- Run this in the final client Supabase project SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  venue text not null,
  city text not null,
  country char(2) not null,
  ticket_url text,
  is_sold_out boolean not null default false,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_date date not null,
  type text not null check (type in ('single', 'ep', 'album')),
  artwork_url text,
  spotify_url text,
  soundcloud_url text,
  bandcamp_url text,
  youtube_url text,
  created_at timestamptz not null default now()
);

alter table public.shows enable row level security;
alter table public.releases enable row level security;

drop policy if exists "public read shows" on public.shows;
create policy "public read shows"
  on public.shows
  for select
  using (true);

drop policy if exists "public read releases" on public.releases;
create policy "public read releases"
  on public.releases
  for select
  using (true);

insert into storage.buckets (id, name, public)
values ('release-artwork', 'release-artwork', true)
on conflict (id) do update
set public = excluded.public;
