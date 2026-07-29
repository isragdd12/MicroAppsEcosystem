-- Public-schema views so the REST API can access petcare tables
-- without needing 'petcare' in the exposed schemas dashboard setting.
-- SECURITY INVOKER ensures RLS from the underlying tables is enforced.

create or replace view public.petcare_pets
  with (security_invoker = true)
as
  select * from petcare.pets;

create or replace view public.petcare_feedings
  with (security_invoker = true)
as
  select * from petcare.feedings;

-- Grant REST API roles access to the views
grant select, insert, update, delete on public.petcare_pets to authenticated;
grant select on public.petcare_pets to anon;

grant select, insert, update, delete on public.petcare_feedings to authenticated;
grant select on public.petcare_feedings to anon;
