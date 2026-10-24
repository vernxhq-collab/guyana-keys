-- Runs after supabase/listing-site-facts.sql. Safe to run more than once.

delete from public.properties where id in ('site-facts-row', 'site-facts-blank', 'site-facts-bad');

insert into public.properties (
  id, agent_id, title, status, featured,
  generator, water_tank, water_notes, parking, parking_spaces, flood_risk, furnished
) values (
  'site-facts-row',
  '22222222-2222-4222-8222-222222222222',
  'Site facts',
  'hidden',
  false,
  'yes',
  'yes',
  'tank on the roof',
  'yard',
  2,
  'some',
  'partly'
);

insert into public.properties (id, agent_id, title, status, featured)
values (
  'site-facts-blank',
  '22222222-2222-4222-8222-222222222222',
  'Blank facts',
  'hidden',
  false
);

do $$
begin
  if not exists (
    select 1 from public.properties
    where id = 'site-facts-blank'
      and generator is null
      and water_tank is null
      and parking is null
      and flood_risk is null
      and furnished is null
  ) then
    raise exception 'blank listing details were not left empty';
  end if;
  begin
    insert into public.properties (id, agent_id, title, status, featured, generator)
    values ('site-facts-bad', '22222222-2222-4222-8222-222222222222', 'Bad generator', 'hidden', false, 'sometimes');
    raise exception 'a generator value outside the list was stored';
  exception when check_violation then
    null;
  end;
end $$;

delete from public.properties where id in ('site-facts-row', 'site-facts-blank', 'site-facts-bad');
