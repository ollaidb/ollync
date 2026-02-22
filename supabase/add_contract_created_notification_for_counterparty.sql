-- =========================================================
-- Notification contrat: prévenir la contrepartie à la création
-- =========================================================

begin;

-- Colonnes utiles (idempotent)
alter table if exists public.notifications
  add column if not exists sender_id uuid references public.profiles(id) on delete set null,
  add column if not exists group_key varchar(255),
  add column if not exists metadata jsonb;

create index if not exists idx_notifications_sender_id on public.notifications(sender_id);
create index if not exists idx_notifications_group_key on public.notifications(group_key);
create index if not exists idx_notifications_user_type_created on public.notifications(user_id, type, created_at desc);

-- Supprimer anciens triggers/fonctions contrats pour éviter les doublons
DROP TRIGGER IF EXISTS trigger_notify_on_contract_created ON public.contracts;
DROP TRIGGER IF EXISTS trg_notify_on_contract_created ON public.contracts;
DROP FUNCTION IF EXISTS public.notify_on_contract_created();

-- Nouveau trigger: notif uniquement vers la contrepartie
create or replace function public.notify_contract_created_to_counterparty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_name text;
  v_post_title text;
  v_title text;
  v_content text;
  v_group_key text;
begin
  if NEW.counterparty_id is null or NEW.creator_id is null then
    return NEW;
  end if;

  -- Pas de notif à soi-même
  if NEW.counterparty_id = NEW.creator_id then
    return NEW;
  end if;

  select coalesce(p.full_name, p.username, 'Quelqu''un')
    into v_creator_name
  from public.profiles p
  where p.id = NEW.creator_id;

  select p.title
    into v_post_title
  from public.posts p
  where p.id = NEW.post_id;

  v_post_title := coalesce(v_post_title, 'Contrat');
  v_title := 'Nouveau contrat reçu';
  v_content := v_creator_name || ' a créé un contrat avec vous.';
  v_group_key := 'contract_created_' || NEW.counterparty_id::text || '_' || NEW.id::text;

  insert into public.notifications (user_id, type, title, content, related_id, sender_id, group_key, metadata)
  values (
    NEW.counterparty_id,
    'contract_created',
    v_title,
    v_content,
    NEW.id,
    NEW.creator_id,
    v_group_key,
    jsonb_build_object(
      'contract_id', NEW.id,
      'post_id', NEW.post_id,
      'application_id', NEW.application_id,
      'creator_id', NEW.creator_id,
      'counterparty_id', NEW.counterparty_id,
      'status', NEW.status,
      'contract_type', NEW.contract_type,
      'payment_type', NEW.payment_type,
      'post_title', v_post_title
    )
  );

  return NEW;
end;
$$;

CREATE TRIGGER trg_notify_contract_created_to_counterparty
AFTER INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.notify_contract_created_to_counterparty();

commit;
