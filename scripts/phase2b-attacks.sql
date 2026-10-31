-- Phase 2b attacks. Synthetic ids only. Run after supabase/phase2b-levels.sql.
-- Safe to run more than once. Do not run this on the live database.

do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (id, email) values
      ('a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'level-agent@example.com'),
      ('a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'level-other@example.com'),
      ('b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', 'level-reviewer@example.com'),
      ('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'level-senior@example.com'),
      ('c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1', 'level-stranger@example.com'),
      ('d1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1', 'level-paused@example.com'),
      ('e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1', 'level-licence@example.com'),
      ('f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1', 'level-expired@example.com')
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.profiles (id, email, name, role, suspended, approved)
values
  ('a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'level-agent@example.com', 'Sample Agent', 'agent', false, true),
  ('a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'level-other@example.com', 'Sample Other', 'agent', false, true),
  ('b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', 'level-reviewer@example.com', 'Sample Reviewer', 'admin', false, true),
  ('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'level-senior@example.com', 'Sample Senior', 'admin', false, true),
  ('c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1', 'level-stranger@example.com', 'Sample Stranger', 'agent', false, true),
  ('d1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1', 'level-paused@example.com', 'Sample Paused', 'agent', true, false),
  ('e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1', 'level-licence@example.com', 'Sample Licence', 'agent', false, true),
  ('f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1', 'level-expired@example.com', 'Sample Expired', 'agent', false, true)
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  suspended = excluded.suspended,
  approved = excluded.approved;

delete from public.appeals where agent_id in (
  'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
  'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1',
  'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
);
delete from public.customer_reports where id = '11111111-1111-4111-8111-111111111112';
delete from public.agent_licences where agent_id in (
  'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
  'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1'
);
delete from public.keys_check_flags where check_id in ('p2b-a1', 'p2b-flag');
delete from public.keys_checks where id in ('p2b-a1', 'p2b-flag', 'p2b-guard');
delete from public.reviewer_roles where user_id in (
  'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
  'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
  'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1'
);

do $$
begin
  perform set_config('gk.vf_decide', 'on', true);
  delete from public.verification_status where agent_id in (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2',
    'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
    'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1',
    'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
  );
  perform set_config('gk.vf_decide', '', true);
end $$;

insert into public.reviewer_roles (user_id, marketplace_id, role) values
  ('b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', 'gy', 'reviewer'),
  ('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'gy', 'senior_reviewer');

insert into public.keys_checks (id, agent_id, status, subject_type, provider)
values
  ('p2b-a1', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'submitted', 'agent', 'manual'),
  ('p2b-guard', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'collecting', 'agent', 'manual'),
  ('p2b-flag', 'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'submitted', 'agent', 'manual');

insert into public.keys_check_flags (id, agent_id, check_id, flag, detail)
values ('p2b-flag-1', 'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'p2b-flag', 'duplicate_id_number', 'synthetic duplicate signal');

-- Direct level writes are refused, including for the table owner.
do $$
declare
  failed boolean := false;
begin
  begin
    insert into public.verification_status (agent_id, marketplace_id, level, state)
    values ('a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'gy', 'licensed_agent', 'active');
  exception when others then
    failed := sqlerrm like '%review functions%';
  end;
  if not failed then raise exception 'a direct level insert was stored'; end if;
end $$;

-- A signed-in user cannot call the review function.
do $$
declare
  failed boolean := false;
begin
  begin
    set local role authenticated;
    perform public.vf_decide(
      'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
      'p2b-a1',
      'approve',
      'This should be refused.',
      'manual',
      '',
      null
    );
  exception when insufficient_privilege then
    failed := true;
  end;
  reset role;
  if not failed then raise exception 'authenticated called vf_decide'; end if;
end $$;

-- A person with no reviewer role cannot decide.
do $$
declare
  failed boolean := false;
begin
  begin
    perform public.vf_decide(
      'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
      'p2b-a1',
      'approve',
      'A stranger tried this.',
      'manual',
      '',
      null
    );
  exception when others then
    failed := sqlerrm like '%reviewer role required%';
  end;
  if not failed then raise exception 'a non-reviewer decided a check'; end if;
end $$;

-- A reviewer cannot approve their own check.
insert into public.reviewer_roles (user_id, marketplace_id, role)
values ('a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'gy', 'reviewer');

do $$
declare
  failed boolean := false;
begin
  begin
    perform public.vf_decide(
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
      'p2b-a1',
      'approve',
      'Trying to approve myself.',
      'manual',
      '',
      null
    );
  exception when others then
    failed := sqlerrm like '%cannot decide their own check%';
  end;
  if not failed then raise exception 'a reviewer approved their own check'; end if;
end $$;

delete from public.reviewer_roles where user_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1';

-- Status columns stay out of an agent's reach, and the trigger blocks a granted attempt.
do $$
declare
  msg text := '';
begin
  if has_column_privilege('authenticated', 'public.keys_checks', 'status', 'UPDATE')
     or has_column_privilege('authenticated', 'public.keys_checks', 'decision', 'UPDATE') then
    raise exception 'an agent can update status or decision';
  end if;
  grant update (status) on public.keys_checks to authenticated;
  begin
    perform set_config('request.jwt.claim.sub', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    set local role authenticated;
    update public.keys_checks set status = 'approved' where id = 'p2b-guard';
    msg := 'updated';
  exception when others then
    msg := sqlerrm;
  end;
  reset role;
  revoke update (status) on public.keys_checks from authenticated;
  if msg not like '%vf_decide%' and msg not like '%cannot be changed here%' then
    raise exception 'an agent changed status (%)', msg;
  end if;
end $$;

-- Admin approval: level, decision, and audit row.
do $$
declare
  before_decisions integer;
  before_audit integer;
  decision_id uuid;
  month text := private.vf_month(now());
begin
  select count(*) into before_decisions from public.verification_decisions
  where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1' and action = 'approve';
  select count(*) into before_audit from public.audit_events where action = 'vf_approve';

  set local role service_role;
  decision_id := public.vf_decide(
    'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
    'p2b-a1',
    'approve',
    'Synthetic approval for the level check.',
    'manual',
    '',
    null
  );
  reset role;

  if not exists (
    select 1 from public.verification_status
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
      and level = 'identity_reviewed' and state = 'active' and badge_month = month
  ) then
    raise exception 'approval did not set identity_reviewed';
  end if;
  if (select count(*) from public.verification_decisions
      where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1' and action = 'approve') <> before_decisions + 1 then
    raise exception 'approval did not write a decision';
  end if;
  if not exists (
    select 1 from public.audit_events
    where action = 'vf_approve' and detail = decision_id::text and detail !~ 'Synthetic'
  ) then
    raise exception 'approval did not write an audit row';
  end if;
  if (select count(*) from public.audit_events where action = 'vf_approve') <> before_audit + 1 then
    raise exception 'approval wrote the wrong number of audit rows';
  end if;
  if not exists (
    select 1 from public.public_agent_badges
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
      and level = 'identity_reviewed' and badge_month = month
  ) then
    raise exception 'the public badge was not identity_reviewed';
  end if;
end $$;

-- A reviewer cannot pause or remove a badge, and cannot grant Level 3.
do $$
declare
  failed boolean;
begin
  failed := false;
  begin
    perform public.vf_decide(
      'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
      '',
      'revoke',
      'A reviewer tried to remove it.',
      'manual',
      '',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
    );
  exception when others then
    failed := sqlerrm like '%senior reviewer%';
  end;
  if not failed then raise exception 'a reviewer removed a badge'; end if;

  failed := false;
  begin
    perform public.vf_licence_decide(
      'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
      'approve',
      'A reviewer tried Level 3.',
      'GRA Licence Revenue Office confirmed by email, ref 1001',
      'issuer_email'
    );
  exception when others then
    failed := sqlerrm like '%senior reviewer%';
  end;
  if not failed then raise exception 'a reviewer granted Level 3'; end if;
end $$;

-- An uploaded image does not earn Level 3. A recorded confirmation does.
insert into public.agent_licences (id, agent_id, licence_type, licence_number, expiry_date, check_status)
values ('p2b-lic-a1', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'gra_house_agent', 'SYN-1001', current_date + 20, 'pending');

do $$
declare
  failed boolean := false;
  month text;
begin
  begin
    perform public.vf_licence_decide(
      'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
      'approve',
      'Image only, which is not enough.',
      'uploaded image',
      'issuer_email'
    );
  exception when others then
    failed := sqlerrm like '%uploaded licence image%';
  end;
  if not failed then raise exception 'an uploaded image earned Level 3'; end if;

  perform public.vf_licence_decide(
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'approve',
    'Office confirmed the licence.',
    'GRA Licence Revenue Office confirmed by email, ref 1001',
    'issuer_email'
  );
  month := private.vf_month(now());
  if not exists (
    select 1 from public.verification_status
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
      and level = 'licensed_agent' and state = 'active' and badge_month = month
  ) then
    raise exception 'Level 3 was not recorded';
  end if;
  if not exists (
    select 1 from public.public_agent_badges
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1' and level = 'licensed_agent'
  ) then
    raise exception 'the public badge was not licensed_agent';
  end if;
end $$;

-- Revoke removes the badge and needs a reason. Appeal, then a senior upholds it. History stays.
do $$
declare
  failed boolean := false;
  appeal_id uuid;
begin
  begin
    perform public.vf_decide(
      'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
      '',
      'revoke',
      'no',
      'manual',
      '',
      'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
    );
  exception when others then
    failed := sqlerrm like '%reason is required%';
  end;
  if not failed then raise exception 'a badge was removed without a reason'; end if;

  perform public.vf_decide(
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    '',
    'revoke',
    'Synthetic removal after a review.',
    'manual',
    '',
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  );
  if exists (
    select 1 from public.public_agent_badges
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  ) then
    raise exception 'the badge was still public after removal';
  end if;

  appeal_id := public.vf_open_appeal(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'Please look at this synthetic appeal again.',
    null
  );
  if appeal_id is null then raise exception 'the appeal did not open'; end if;

  perform public.vf_decide_appeal(
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    appeal_id,
    'appeal_upheld',
    'The synthetic appeal is upheld.'
  );
  if not exists (
    select 1 from public.verification_status
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1' and state = 'active' and level = 'licensed_agent'
  ) then
    raise exception 'an upheld appeal did not restore the badge';
  end if;
  if (select count(*) from public.verification_decisions
      where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1' and action in ('revoke', 'appeal_upheld')) < 2 then
    raise exception 'the appeal history is missing';
  end if;
end $$;

-- A reviewer cannot uphold their own appeal, and a non-senior cannot decide one.
do $$
declare
  failed boolean := false;
  appeal_id uuid;
begin
  perform public.vf_decide(
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    '',
    'suspend',
    'Synthetic pause for the appeal test.',
    'manual',
    '',
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  );
  appeal_id := public.vf_open_appeal(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'Please lift this synthetic pause.',
    null
  );
  begin
    perform public.vf_decide_appeal(
      'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
      appeal_id,
      'appeal_denied',
      'A reviewer tried to decide it.'
    );
  exception when others then
    failed := sqlerrm like '%senior reviewer%';
  end;
  if not failed then raise exception 'a reviewer decided an appeal'; end if;

  perform public.vf_decide_appeal(
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    appeal_id,
    'appeal_denied',
    'The synthetic pause stays.'
  );
  if not exists (
    select 1 from public.verification_status
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1' and state = 'suspended'
  ) then
    raise exception 'a denied appeal changed the pause';
  end if;
  if exists (
    select 1 from public.public_agent_badges
    where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  ) then
    raise exception 'a paused agent still has a public badge';
  end if;
end $$;

-- Expired licence: Level 3 drops, Level 2 stays public.
do $$
declare
  removed integer;
begin
  perform set_config('gk.vf_decide', 'on', true);
  insert into public.verification_status (
    agent_id, marketplace_id, level, state, badge_month, level2_badge_month,
    level2_since, id_expires_on, licence_expires_on, recheck_at
  ) values (
    'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1', 'gy', 'licensed_agent', 'active', 'Oct 2026', 'Sept 2026',
    now() - interval '1 month', current_date + 400, current_date - 1, current_date - 1
  );
  perform set_config('gk.vf_decide', '', true);

  removed := public.vf_expire_due('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2');
  if removed < 1 then raise exception 'vf_expire_due did not move the licence'; end if;
  if not exists (
    select 1 from public.verification_status
    where agent_id = 'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1'
      and level = 'identity_reviewed' and state = 'active' and badge_month = 'Sept 2026'
  ) then
    raise exception 'an expired licence did not leave Level 2 in place';
  end if;
  if exists (
    select 1 from public.public_agent_badges
    where agent_id = 'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1' and level = 'licensed_agent'
  ) then
    raise exception 'Level 3 was still public after the licence date';
  end if;
  if not exists (
    select 1 from public.public_agent_badges
    where agent_id = 'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1' and level = 'identity_reviewed'
  ) then
    raise exception 'Level 2 was not public after the licence date';
  end if;
end $$;

-- ID date passed: the public line goes away.
do $$
begin
  perform set_config('gk.vf_decide', 'on', true);
  insert into public.verification_status (
    agent_id, marketplace_id, level, state, badge_month, level2_since, id_expires_on, recheck_at
  ) values (
    'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1', 'gy', 'identity_reviewed', 'active', 'Jan 2025',
    now() - interval '30 months', current_date - 1, current_date - 1
  );
  perform set_config('gk.vf_decide', '', true);
  perform public.vf_expire_due('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2');
  if not exists (
    select 1 from public.verification_status
    where agent_id = 'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1' and state = 'expired'
  ) then
    raise exception 'an expired ID review stayed active';
  end if;
  if exists (
    select 1 from public.public_agent_badges
    where agent_id = 'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
  ) then
    raise exception 'an expired ID review stayed on the public view';
  end if;
end $$;

-- Public view and agent reads.
do $$
begin
  perform set_config('gk.vf_decide', 'on', true);
  insert into public.verification_status (agent_id, marketplace_id, level, state, badge_month)
  values ('d1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1', 'gy', 'identity_reviewed', 'active', 'Oct 2026');
  insert into public.verification_status (agent_id, marketplace_id, level, state, badge_month)
  values ('a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'gy', 'registered', 'active', '');
  perform set_config('gk.vf_decide', '', true);
end $$;

do $$
begin
  perform set_config('gk.vf_decide', 'on', true);
  insert into public.verification_decisions (
    agent_id, marketplace_id, action, reviewer_id, method, evidence_ref, reason
  ) values (
    'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 'gy', 'reject',
    'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', 'manual', 'hidden reference 9999',
    'Synthetic note for the other agent.'
  );
  perform set_config('gk.vf_decide', '', true);
end $$;

do $$
declare
  failed boolean := false;
  seen integer;
begin
  if exists (
    select 1 from public.public_agent_badges
    where agent_id in ('d1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1', 'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2')
  ) then
    raise exception 'the public view showed a paused agent or Level 1';
  end if;

  begin
    set local role anon;
    perform 1 from public.verification_decisions;
  exception when insufficient_privilege then
    failed := true;
  end;
  reset role;
  if not failed then raise exception 'anon read the decision history'; end if;

  failed := false;
  begin
    set local role anon;
    perform 1 from public.id_documents;
  exception when insufficient_privilege then
    failed := true;
  end;
  reset role;
  if not failed then raise exception 'anon read documents'; end if;

  perform set_config('request.jwt.claim.sub', 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
  select count(*) into seen from public.verification_status
  where agent_id = 'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2';
  if seen <> 0 then
    raise exception 'an agent read another agent level row';
  end if;
  select count(*) into seen from public.verification_decisions
  where reason = 'Synthetic note for the other agent.';
  if seen <> 0 then
    raise exception 'an agent read another agent decision';
  end if;
  reset role;

  failed := false;
  begin
    update public.verification_decisions set reason = 'changed' where reason = 'Synthetic note for the other agent.';
  exception when others then
    failed := sqlerrm like '%append-only%';
  end;
  if not failed then raise exception 'a decision row was edited'; end if;
end $$;

-- Service role can still move a Keys Check status, which the phone scan relies on.
do $$
begin
  set local role service_role;
  update public.keys_checks set status = 'noted' where id = 'p2b-flag';
  reset role;
  if not exists (select 1 from public.keys_checks where id = 'p2b-flag' and status = 'noted') then
    raise exception 'the service role could not update a Keys Check';
  end if;
end $$;

-- Leave no public badge for these synthetic agents.
do $$
begin
  perform set_config('gk.vf_decide', 'on', true);
  update public.verification_status set state = 'expired'
  where agent_id in (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2',
    'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
    'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1',
    'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
  );
  perform set_config('gk.vf_decide', '', true);
end $$;

delete from public.appeals where agent_id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1';
delete from public.keys_check_flags where id = 'p2b-flag-1';
delete from public.keys_checks where id in ('p2b-a1', 'p2b-flag', 'p2b-guard');
delete from public.agent_licences where id = 'p2b-lic-a1';
