-- Create real public-schema tables for the Supabase (web) path.
-- The petcare.* tables remain for the native SQLite sync engine.
-- PostgREST exposes public schema by default so no dashboard config needed.

-- Drop the views that were failing for writes
drop view if exists public.petcare_pets;
drop view if exists public.petcare_feedings;

-- public.pets
create table if not exists public.pets (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  species       text not null,
  breed         text,
  birth_date    text,
  photo_url     text,
  notes         text,
  owner_id      uuid references auth.users(id),
  sync_status   text not null default 'synced',
  created_at    text not null,
  updated_at    text not null,
  deleted_at    text
);

alter table public.pets enable row level security;

create policy "pets: owner select"
  on public.pets for select
  using (auth.uid() = owner_id);

create policy "pets: owner insert"
  on public.pets for insert
  with check (auth.uid() = owner_id);

create policy "pets: owner update"
  on public.pets for update
  using (auth.uid() = owner_id);

create policy "pets: owner delete"
  on public.pets for delete
  using (auth.uid() = owner_id);

-- public.feedings
create table if not exists public.feedings (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id),
  food_type     text not null,
  amount_grams  real,
  notes         text,
  fed_at        text not null,
  owner_id      uuid references auth.users(id),
  sync_status   text not null default 'synced',
  created_at    text not null,
  updated_at    text not null,
  deleted_at    text
);

alter table public.feedings enable row level security;

create policy "feedings: owner select"
  on public.feedings for select
  using (auth.uid() = owner_id);

create policy "feedings: owner insert"
  on public.feedings for insert
  with check (auth.uid() = owner_id);

create policy "feedings: owner update"
  on public.feedings for update
  using (auth.uid() = owner_id);

create policy "feedings: owner delete"
  on public.feedings for delete
  using (auth.uid() = owner_id);

grant select, insert, update, delete on public.pets     to authenticated;
grant select, insert, update, delete on public.feedings to authenticated;
