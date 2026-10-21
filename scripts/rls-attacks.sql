-- Runs after scripts/rls-seed.sql and supabase/p0-rls.sql.
-- Safe to run more than once. A leaked or unexpected row fails the script.

delete from public.enquiries where id in ('enq-attack', 'enq-owned');
delete from public.properties where id in ('attack-live', 'agent-ok', 'home-stopped', 'home-buyer');
update public.properties set title = 'Bel Air house', status = 'live', featured = false where id = 'home-1';
update public.properties set title = 'Draft house', status = 'hidden', featured = false where id = 'home-hidden';

-- The suspended agent is seeded before the backfill, with approved left null.
-- After p0-rls.sql that flag must still be false.
do $$
declare
  stopped uuid := '33333333-3333-4333-8333-333333333333';
  agent uuid := '22222222-2222-4222-8222-222222222222';
begin
  if not exists (
    select 1 from public.profiles
    where id = stopped and role = 'agent' and suspended = true and approved = false
  ) then
    raise exception 'suspended agent was approved by the backfill';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = agent and role = 'agent' and suspended = false and approved = true
  ) then
    raise exception 'active agent was not approved by the backfill';
  end if;
end $$;

do $$
declare
  buyer uuid := '11111111-1111-4111-8111-111111111111';
  failed boolean := false;
begin
  perform set_config('request.jwt.claim.sub', buyer::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  begin
    insert into public.properties (id, agent_id, status, featured, title)
    values ('attack-live', buyer, 'live', true, 'Stolen listing');
  exception when others then
    failed := true;
  end;
  reset role;
  if not failed then
    raise exception 'buyer inserted a property';
  end if;
  if exists (select 1 from public.properties where id = 'attack-live') then
    raise exception 'buyer insert left a property row';
  end if;
end $$;

do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
begin
  perform set_config('request.jwt.claim.sub', agent::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  insert into public.properties (id, agent_id, status, featured, title)
  values ('agent-ok', agent, 'hidden', false, 'Allowed draft');
  reset role;
  if not exists (select 1 from public.properties where id = 'agent-ok' and status = 'hidden' and featured = false) then
    raise exception 'approved agent could not save a hidden listing';
  end if;
end $$;

do $$
declare
  buyer uuid := '11111111-1111-4111-8111-111111111111';
  failed text := '';
begin
  perform set_config('request.jwt.claim.sub', buyer::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  begin
    update public.profiles set verified = true, approved = true where id = buyer;
    failed := 'update succeeded';
  exception when others then
    failed := sqlerrm;
  end;
  reset role;
  if failed not like '%cannot be changed%' then
    raise exception 'buyer verified update was not blocked: %', failed;
  end if;
  if exists (select 1 from public.profiles where id = buyer and (verified or approved)) then
    raise exception 'buyer changed verified or approved';
  end if;
end $$;

do $$
declare
  buyer uuid := '11111111-1111-4111-8111-111111111111';
  agent uuid := '22222222-2222-4222-8222-222222222222';
  row public.enquiries;
begin
  perform set_config('request.jwt.claim.sub', buyer::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  insert into public.enquiries (
    id, buyer_id, agent_id, property_id, stage, agent_reply, private_note, score, next_step, viewing_at, source, intent
  ) values (
    'enq-attack', buyer, buyer, null, 'offer', 'sent already', 'private', 'High', 'call them', now(), 'spoof', 'I own this'
  );
  insert into public.enquiries (
    id, buyer_id, agent_id, property_id, stage, viewing_at, source, intent
  ) values (
    'enq-owned', buyer, buyer, 'home-1', 'offer', now(), 'spoof', 'fake intent'
  );
  reset role;
  select * into row from public.enquiries where id = 'enq-attack';
  if row.stage is distinct from 'new'
    or row.agent_id is not null
    or row.viewing_at is not null
    or row.source is distinct from 'guyana_keys'
    or row.intent is distinct from ''
    or row.agent_reply is distinct from ''
    or row.private_note is distinct from ''
    or row.score is not null
    or row.next_step is distinct from ''
  then
    raise exception 'enquiry without a property kept buyer fields';
  end if;
  select * into row from public.enquiries where id = 'enq-owned';
  if row.agent_id is distinct from agent or row.stage is distinct from 'new' or row.viewing_at is not null or row.intent is distinct from '' then
    raise exception 'enquiry kept the buyer agent, stage, viewing, or intent';
  end if;
end $$;

do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
  failed text := '';
begin
  perform set_config('request.jwt.claim.sub', agent::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  begin
    update public.properties set status = 'live' where id = 'home-hidden';
    failed := 'update succeeded';
  exception when others then
    failed := sqlerrm;
  end;
  reset role;
  if failed not like '%stays hidden%' then
    raise exception 'agent published a hidden listing from the client: %', failed;
  end if;
  if exists (select 1 from public.properties where id = 'home-hidden' and status = 'live') then
    raise exception 'hidden listing went live from the client';
  end if;
end $$;

do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
begin
  perform set_config('request.jwt.claim.sub', agent::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  update public.properties set title = 'Renamed draft' where id = 'home-hidden';
  reset role;
  if not exists (select 1 from public.properties where id = 'home-hidden' and title = 'Renamed draft' and status = 'hidden') then
    raise exception 'active agent could not edit a hidden listing';
  end if;
end $$;

-- Result: allowed. Approval is account-level. An approved agent can edit a live
-- listing through the database API. There is no second review of that edit.
do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
begin
  if not exists (
    select 1 from public.profiles
    where id = agent and role = 'agent' and suspended = false and approved = true
  ) then
    raise exception 'the live-listing edit was not run as an approved agent';
  end if;
  perform set_config('request.jwt.claim.sub', agent::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  update public.properties set title = 'Edited live' where id = 'home-1';
  reset role;
  if not exists (
    select 1 from public.properties
    where id = 'home-1' and title = 'Edited live' and status = 'live'
  ) then
    raise exception 'approved agent could not edit a live listing';
  end if;
end $$;

do $$
declare
  stopped uuid := '33333333-3333-4333-8333-333333333333';
begin
  if not exists (
    select 1 from public.profiles
    where id = stopped and role = 'agent' and suspended = true and approved = false
  ) then
    raise exception 'suspended agent was approved by the backfill';
  end if;
  insert into public.properties (id, agent_id, title, status, featured)
  values ('home-stopped', stopped, 'Still mine', 'hidden', false)
  on conflict (id) do update set agent_id = stopped, title = 'Still mine', status = 'hidden';

  perform set_config('request.jwt.claim.sub', stopped::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  update public.properties set title = 'Taken' where id = 'home-stopped';
  delete from public.properties where id = 'home-stopped';
  reset role;
  if exists (select 1 from public.properties where id = 'home-stopped' and title = 'Taken') then
    raise exception 'suspended agent edited a listing';
  end if;
  if not exists (select 1 from public.properties where id = 'home-stopped') then
    raise exception 'suspended agent deleted a listing';
  end if;
  if exists (
    select 1 from public.profiles
    where id = stopped and approved = true
  ) then
    raise exception 'suspended agent was approved by the backfill';
  end if;
end $$;

do $$
declare
  buyer uuid := '11111111-1111-4111-8111-111111111111';
begin
  insert into public.properties (id, agent_id, title, status, featured)
  values ('home-buyer', buyer, 'Not yours', 'hidden', false)
  on conflict (id) do update set agent_id = buyer, title = 'Not yours', status = 'hidden';

  perform set_config('request.jwt.claim.sub', buyer::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  update public.properties set title = 'Stolen edit', status = 'live' where id = 'home-buyer';
  reset role;
  if exists (select 1 from public.properties where id = 'home-buyer' and (title = 'Stolen edit' or status = 'live')) then
    raise exception 'buyer edited a listing they do not publish';
  end if;
end $$;

-- Phase tables exist on the fixture database. The real migration does not create them.
do $$
begin
  if to_regclass('public.agencies') is null then
    return;
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.agencies'::regclass) then
    raise exception 'agencies has no row security';
  end if;
  if has_table_privilege('anon', 'public.agencies', 'select')
    or has_table_privilege('anon', 'public.audit_events', 'select')
    or has_table_privilege('anon', 'public.listing_stats', 'select')
    or has_table_privilege('anon', 'public.buyer_needs', 'select')
    or has_table_privilege('anon', 'public.outbox', 'select')
  then
    raise exception 'anon can still read a phase table';
  end if;
  set local role anon;
  begin
    perform 1 from public.agencies;
    raise exception 'anon read agencies';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;
