-- =========================================================
-- NOTIFICATIONS MATCH_REQUESTS (toutes catégories)
-- Couvre: request/apply/buy/reserve/ticket
-- =========================================================

begin;

-- 1) Colonnes utiles sur notifications (idempotent)
alter table if exists public.notifications
  add column if not exists sender_id uuid references public.profiles(id) on delete set null,
  add column if not exists group_key varchar(255),
  add column if not exists metadata jsonb;

create index if not exists idx_notifications_sender_id on public.notifications(sender_id);
create index if not exists idx_notifications_group_key on public.notifications(group_key);
create index if not exists idx_notifications_user_group on public.notifications(user_id, group_key);
create index if not exists idx_notifications_user_type_created on public.notifications(user_id, type, created_at desc);

-- 2) Helper label selon intent
create or replace function public.get_match_request_intent_label(p_intent text)
returns text
language sql
immutable
as $$
  select case lower(coalesce(p_intent, 'request'))
    when 'apply' then 'candidature'
    when 'reserve' then 'demande de réservation'
    when 'ticket' then 'demande événement'
    when 'buy' then 'demande achat'
    else 'demande'
  end;
$$;

-- 3) Notification à la création d'une demande
create or replace function public.notify_match_request_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_title text;
  v_content text;
  v_group_key text;
begin
  v_label := public.get_match_request_intent_label(NEW.request_intent);
  v_title := 'Nouvelle ' || v_label;
  v_content := 'Vous avez reçu une nouvelle ' || v_label || '.';
  v_group_key := 'match_request_received_' || NEW.to_user_id::text || '_' || NEW.id::text;

  insert into public.notifications (user_id, type, title, content, related_id, sender_id, group_key, metadata)
  values (
    NEW.to_user_id,
    'match_request_received',
    v_title,
    v_content,
    NEW.id,
    NEW.from_user_id,
    v_group_key,
    jsonb_build_object(
      'match_request_id', NEW.id,
      'request_intent', NEW.request_intent,
      'status', NEW.status,
      'from_user_id', NEW.from_user_id,
      'to_user_id', NEW.to_user_id,
      'related_post_id', NEW.related_post_id
    )
  );

  return NEW;
end;
$$;

-- 4) Notification sur changement de statut
create or replace function public.notify_match_request_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_type text;
  v_title text;
  v_content text;
  v_group_key text;
begin
  if NEW.status is not distinct from OLD.status then
    return NEW;
  end if;

  v_label := public.get_match_request_intent_label(NEW.request_intent);

  if NEW.status = 'accepted' then
    v_type := 'match_request_accepted';
    v_title := 'Votre ' || v_label || ' a été acceptée';
    v_content := 'Bonne nouvelle, votre ' || v_label || ' a été acceptée.';
  elsif NEW.status = 'declined' then
    v_type := 'match_request_declined';
    v_title := 'Votre ' || v_label || ' a été refusée';
    v_content := 'Votre ' || v_label || ' a été refusée.';
  elsif NEW.status = 'cancelled' then
    v_type := 'match_request_cancelled';
    v_title := 'Demande annulée';
    v_content := 'Une ' || v_label || ' a été annulée.';
  else
    return NEW;
  end if;

  v_group_key := v_type || '_' || NEW.from_user_id::text || '_' || NEW.id::text;

  -- notifier le demandeur
  insert into public.notifications (user_id, type, title, content, related_id, sender_id, group_key, metadata)
  values (
    NEW.from_user_id,
    v_type,
    v_title,
    v_content,
    NEW.id,
    NEW.to_user_id,
    v_group_key,
    jsonb_build_object(
      'match_request_id', NEW.id,
      'request_intent', NEW.request_intent,
      'status', NEW.status,
      'from_user_id', NEW.from_user_id,
      'to_user_id', NEW.to_user_id,
      'related_post_id', NEW.related_post_id,
      'conversation_id', NEW.conversation_id
    )
  );

  return NEW;
end;
$$;

-- 5) Triggers
DROP TRIGGER IF EXISTS trg_notify_match_request_created ON public.match_requests;
CREATE TRIGGER trg_notify_match_request_created
AFTER INSERT ON public.match_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_match_request_created();

DROP TRIGGER IF EXISTS trg_notify_match_request_status_changed ON public.match_requests;
CREATE TRIGGER trg_notify_match_request_status_changed
AFTER UPDATE ON public.match_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_match_request_status_changed();

commit;
