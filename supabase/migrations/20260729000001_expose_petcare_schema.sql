-- Expose the petcare schema to PostgREST so .schema('petcare') works
-- via the REST API. The db-schemas setting must also include 'petcare'
-- in the Supabase Dashboard → Settings → API → Exposed schemas.
--
-- This grant ensures the PostgREST roles have usage rights on the schema
-- (the Dashboard setting controls which schemas appear in db-schemas).
grant usage on schema petcare to anon, authenticated, service_role;

grant all on all tables in schema petcare to authenticated;
grant select on all tables in schema petcare to anon;
grant all on all sequences in schema petcare to authenticated;

alter default privileges in schema petcare
  grant all on tables to authenticated;

alter default privileges in schema petcare
  grant all on sequences to authenticated;
