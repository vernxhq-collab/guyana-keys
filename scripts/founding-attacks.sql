-- Runs after supabase/founding.sql. Safe to run more than once.

delete from public.message_drafts where id in ('draft-attack', 'draft-skip');
delete from public.properties where id in ('cap-a', 'cap-b', 'cap-c');

do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
begin
  insert into public.properties (id, agent_id, title, status, featured)
  values
    ('cap-a', agent, 'Cap A', 'live', false),
    ('cap-b', agent, 'Cap B', 'live', false);
  begin
    insert into public.properties (id, agent_id, title, status, featured)
    values ('cap-c', agent, 'Cap C', 'live', false);
    raise exception 'cap did not stop';
  exception when others then
    if sqlerrm not like '%live listing cap%' then
      raise;
    end if;
  end;
end $$;

delete from public.properties where id in ('cap-a', 'cap-b', 'cap-c');

insert into public.message_drafts (id, channel, body, status)
values ('draft-attack', 'email', 'Hello', 'draft');

do $$
begin
  begin
    insert into public.message_drafts (id, channel, body, status)
    values ('draft-skip', 'whatsapp', 'Skip', 'sent');
    raise exception 'a message was inserted as sent';
  exception when others then
    if sqlerrm not like '%start as drafts%' then
      raise;
    end if;
  end;
  begin
    update public.message_drafts set status = 'sent' where id = 'draft-attack';
    raise exception 'a draft was sent without approval';
  exception when others then
    if sqlerrm not like '%approved before it is sent%' then
      raise;
    end if;
  end;
end $$;

update public.message_drafts set status = 'approved' where id = 'draft-attack';
update public.message_drafts set status = 'sent' where id = 'draft-attack';

do $$
begin
  if not exists (
    select 1 from public.message_drafts
    where id = 'draft-attack' and status = 'sent' and approved_at is not null and sent_at is not null
  ) then
    raise exception 'an approved draft could not be marked sent';
  end if;
end $$;

delete from public.message_drafts where id = 'draft-attack';
