-- People and homes the attack script expects. Run this BEFORE supabase/p0-rls.sql.
-- Does not set approved. The backfill must leave the suspended agent unapproved.

do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (id, email) values
      ('11111111-1111-4111-8111-111111111111', 'buyer@example.com'),
      ('22222222-2222-4222-8222-222222222222', 'agent@example.com'),
      ('33333333-3333-4333-8333-333333333333', 'stopped@example.com')
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.profiles (id, email, role, suspended)
values
  ('11111111-1111-4111-8111-111111111111', 'buyer@example.com', 'buyer', false),
  ('22222222-2222-4222-8222-222222222222', 'agent@example.com', 'agent', false),
  ('33333333-3333-4333-8333-333333333333', 'stopped@example.com', 'agent', true)
on conflict (id) do update
set email = excluded.email,
    role = excluded.role,
    suspended = excluded.suspended;

insert into public.properties (id, agent_id, title, status, featured)
values
  ('home-1', '22222222-2222-4222-8222-222222222222', 'Bel Air house', 'live', false),
  ('home-hidden', '22222222-2222-4222-8222-222222222222', 'Draft house', 'hidden', false)
on conflict (id) do update
set agent_id = excluded.agent_id,
    title = excluded.title,
    status = excluded.status,
    featured = excluded.featured;
