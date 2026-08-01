-- Move all petcare tables to petcare schema and add new feature tables.
-- The public.* tables remain untouched so no data is lost.
-- API layer now uses supabase.schema('petcare') for all queries.

-- Core tables ----------------------------------------------------------------

create table if not exists petcare.pets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  species     text not null,
  breed       text,
  birth_date  text,
  photo_url   text,
  notes       text,
  owner_id    uuid references auth.users(id),
  created_at  text not null,
  updated_at  text not null,
  deleted_at  text
);
alter table petcare.pets enable row level security;
create policy "pets: owner select" on petcare.pets for select using (auth.uid() = owner_id);
create policy "pets: owner insert" on petcare.pets for insert with check (auth.uid() = owner_id);
create policy "pets: owner update" on petcare.pets for update using (auth.uid() = owner_id);
create policy "pets: owner delete" on petcare.pets for delete using (auth.uid() = owner_id);

create table if not exists petcare.feedings (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references petcare.pets(id),
  food_type    text not null,
  amount_grams real,
  notes        text,
  fed_at       text not null,
  owner_id     uuid references auth.users(id),
  created_at   text not null,
  updated_at   text not null,
  deleted_at   text
);
alter table petcare.feedings enable row level security;
create policy "feedings: owner all" on petcare.feedings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists petcare.pet_weights (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references petcare.pets(id),
  weight_kg   real not null,
  measured_at text not null,
  notes       text,
  owner_id    uuid references auth.users(id),
  created_at  text not null
);
alter table petcare.pet_weights enable row level security;
create policy "pet_weights: owner all" on petcare.pet_weights for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists petcare.health_records (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references petcare.pets(id),
  record_type text not null,
  title       text not null,
  description text,
  record_date text not null,
  vet_name    text,
  owner_id    uuid references auth.users(id),
  created_at  text not null
);
alter table petcare.health_records enable row level security;
create policy "health_records: owner all" on petcare.health_records for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- New feature tables ---------------------------------------------------------

create table if not exists petcare.walk_logs (
  id               uuid primary key default gen_random_uuid(),
  pet_id           uuid not null references petcare.pets(id),
  duration_minutes int,
  distance_km      real,
  route_notes      text,
  walked_at        text not null,
  owner_id         uuid references auth.users(id),
  created_at       text not null
);
alter table petcare.walk_logs enable row level security;
create policy "walk_logs: owner all" on petcare.walk_logs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists petcare.grooming_logs (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references petcare.pets(id),
  grooming_type text not null,
  notes         text,
  groomed_at    text not null,
  owner_id      uuid references auth.users(id),
  created_at    text not null
);
alter table petcare.grooming_logs enable row level security;
create policy "grooming_logs: owner all" on petcare.grooming_logs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists petcare.medications (
  id         uuid primary key default gen_random_uuid(),
  pet_id     uuid not null references petcare.pets(id),
  name       text not null,
  dosage     text,
  frequency  text,
  start_date text not null,
  end_date   text,
  notes      text,
  is_active  boolean not null default true,
  owner_id   uuid references auth.users(id),
  created_at text not null
);
alter table petcare.medications enable row level security;
create policy "medications: owner all" on petcare.medications for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists petcare.appointments (
  id               uuid primary key default gen_random_uuid(),
  pet_id           uuid not null references petcare.pets(id),
  title            text not null,
  appointment_type text not null,
  scheduled_at     text not null,
  notes            text,
  is_completed     boolean not null default false,
  owner_id         uuid references auth.users(id),
  created_at       text not null
);
alter table petcare.appointments enable row level security;
create policy "appointments: owner all" on petcare.appointments for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists petcare.expenses (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references petcare.pets(id),
  category     text not null,
  amount       real not null,
  currency     text not null default 'USD',
  description  text,
  expense_date text not null,
  owner_id     uuid references auth.users(id),
  created_at   text not null
);
alter table petcare.expenses enable row level security;
create policy "expenses: owner all" on petcare.expenses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Grants (schema already exposed in 20260729000001) --------------------------
grant select, insert, update, delete on petcare.pets            to authenticated;
grant select, insert, update, delete on petcare.feedings        to authenticated;
grant select, insert, update, delete on petcare.pet_weights     to authenticated;
grant select, insert, update, delete on petcare.health_records  to authenticated;
grant select, insert, update, delete on petcare.walk_logs       to authenticated;
grant select, insert, update, delete on petcare.grooming_logs   to authenticated;
grant select, insert, update, delete on petcare.medications     to authenticated;
grant select, insert, update, delete on petcare.appointments    to authenticated;
grant select, insert, update, delete on petcare.expenses        to authenticated;
