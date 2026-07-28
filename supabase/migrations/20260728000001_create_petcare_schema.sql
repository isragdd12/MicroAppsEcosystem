-- Pet Care app schema — all app-specific tables live here to keep public clean.
CREATE SCHEMA IF NOT EXISTS petcare;

-- ─── pets ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS petcare.pets (
  id             UUID PRIMARY KEY,
  owner_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  species        TEXT NOT NULL,
  breed          TEXT,
  birth_date     DATE,
  photo_url      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

ALTER TABLE petcare.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pets: owner can read own rows"
  ON petcare.pets FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "pets: owner can insert"
  ON petcare.pets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "pets: owner can update"
  ON petcare.pets FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "pets: owner can delete"
  ON petcare.pets FOR DELETE
  USING (owner_id = auth.uid());

-- ─── feedings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS petcare.feedings (
  id             UUID PRIMARY KEY,
  owner_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id         UUID NOT NULL REFERENCES petcare.pets(id) ON DELETE CASCADE,
  food_type      TEXT NOT NULL,
  amount_grams   NUMERIC,
  notes          TEXT,
  fed_at         TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX ON petcare.feedings(pet_id);
CREATE INDEX ON petcare.feedings(fed_at);

ALTER TABLE petcare.feedings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedings: owner can read own rows"
  ON petcare.feedings FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "feedings: owner can insert"
  ON petcare.feedings FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "feedings: owner can update"
  ON petcare.feedings FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "feedings: owner can delete"
  ON petcare.feedings FOR DELETE
  USING (owner_id = auth.uid());

-- ─── push_tokens ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens: user can upsert own"
  ON public.push_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
