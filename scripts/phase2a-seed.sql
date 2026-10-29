-- Synthetic rows written the old way (plain id_number), before supabase/phase2a-verify.sql runs.
-- Not real ID numbers. Safe to run more than once while the plain column exists.
delete from public.keys_check_flags where id in ('idn-p2a-1', 'idn-p2a-2', 'idn-p2a-3', 'idn-p2a-late');
delete from public.keys_checks where id in ('p2a-1', 'p2a-2', 'p2a-3', 'p2a-late');
insert into public.keys_checks (id, agent_id, id_number) values
  ('p2a-1', '22222222-2222-4222-8222-222222222222', ' syn 0001 '),
  ('p2a-2', '33333333-3333-4333-8333-333333333333', 'SYN0001');
