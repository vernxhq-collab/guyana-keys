-- P0-6. Do not run on production until Boss approves.
-- Replaces the weak insert policies. Service role still bypasses these checks.

create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  begin
    jwt_role := auth.role();
  exception when others then
    return new;
  end;
  if coalesce(jwt_role, '') = 'service_role' or auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.listing_cap is distinct from old.listing_cap
    or new.suspended is distinct from old.suspended
    or new.email is distinct from old.email
    or new.id is distinct from old.id
    or new.verified is distinct from old.verified
    or new.gra_licence is distinct from old.gra_licence
  then
    raise exception 'This account field cannot be changed here';
  end if;
  return new;
end;
$$;

create or replace function private.guard_property_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
  actor text;
begin
  begin
    jwt_role := auth.role();
  exception when others then
    return new;
  end;
  if coalesce(jwt_role, '') = 'service_role' or auth.uid() is null then
    return new;
  end if;
  select role into actor from public.profiles where id = auth.uid();
  if actor = 'agent' and new.featured is distinct from old.featured then
    raise exception 'Agents cannot change featured';
  end if;
  if actor = 'agent' and old.status = 'hidden' and new.status is distinct from 'hidden' then
    raise exception 'A listing stays hidden until the admin approves it';
  end if;
  return new;
end;
$$;

create or replace function private.guard_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
  owner uuid;
begin
  begin
    jwt_role := auth.role();
  exception when others then
    return new;
  end;
  if coalesce(jwt_role, '') = 'service_role' or auth.uid() is null then
    return new;
  end if;
  new.stage := 'new';
  new.agent_reply := '';
  new.private_note := '';
  new.score := null;
  new.next_step := '';
  if new.property_id is not null then
    select agent_id into owner from public.properties where id = new.property_id;
    new.agent_id := owner;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_enquiry_insert on public.enquiries;
create trigger guard_enquiry_insert before insert on public.enquiries
for each row execute function private.guard_enquiry_insert();

drop policy if exists properties_agent_insert on public.properties;
create policy properties_agent_insert on public.properties
for insert to authenticated
with check (
  agent_id = auth.uid()
  and featured = false
  and status = 'hidden'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agent' and suspended = false
  )
);

drop policy if exists enquiries_buyer_insert on public.enquiries;
create policy enquiries_buyer_insert on public.enquiries
for insert to authenticated
with check (
  buyer_id = auth.uid()
  and coalesce(stage, 'new') = 'new'
  and coalesce(agent_reply, '') = ''
  and coalesce(private_note, '') = ''
  and score is null
  and coalesce(next_step, '') = ''
);
