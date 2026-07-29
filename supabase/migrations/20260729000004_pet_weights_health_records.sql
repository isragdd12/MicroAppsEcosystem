create table if not exists public.pet_weights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id),
  weight_kg real not null,
  measured_at text not null,
  notes text,
  owner_id uuid references auth.users(id),
  created_at text not null
);
alter table public.pet_weights enable row level security;
create policy "pet_weights: owner all" on public.pet_weights for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
grant select, insert, update, delete on public.pet_weights to authenticated;

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id),
  record_type text not null,
  title text not null,
  description text,
  record_date text not null,
  vet_name text,
  owner_id uuid references auth.users(id),
  created_at text not null
);
alter table public.health_records enable row level security;
create policy "health_records: owner all" on public.health_records for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
grant select, insert, update, delete on public.health_records to authenticated;
