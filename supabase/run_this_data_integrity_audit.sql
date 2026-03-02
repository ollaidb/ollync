-- Data integrity audit (read-only)
-- Run in Supabase SQL editor before/after updates

select table_name
from information_schema.tables
where table_schema='public'
  and table_name in ('profiles','posts','conversations','messages','notifications','appointments','match_requests')
order by table_name;

select count(*) as messages_without_conversation
from public.messages m
left join public.conversations c on c.id = m.conversation_id
where c.id is null;

select count(*) as notifications_without_recipient
from public.notifications n
left join public.profiles p on p.id = n.user_id
where p.id is null;

select count(*) as appointments_without_users
from public.appointments a
left join public.profiles p1 on p1.id = a.sender_id
left join public.profiles p2 on p2.id = a.recipient_id
where p1.id is null or p2.id is null;

select
  (select count(*) from public.conversations where deleted_at is not null) as conversations_soft_deleted,
  (select count(*) from public.messages where deleted_at is not null) as messages_soft_deleted;

select 'messages' as table_name, max(created_at) as last_created_at from public.messages
union all
select 'notifications' as table_name, max(created_at) as last_created_at from public.notifications
union all
select 'appointments' as table_name, max(created_at) as last_created_at from public.appointments;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in ('profiles','posts','conversations','messages','notifications','appointments','match_requests')
order by tablename;
