-- Mise a jour 2/2
-- Objectif: garantir l'envoi des messages de type contract_share
-- et verifier que l'expediteur est bien partie prenante du contrat.

alter table public.messages
add column if not exists shared_contract_id uuid references public.contracts(id) on delete set null;

create index if not exists idx_messages_shared_contract_id
  on public.messages(shared_contract_id)
  where shared_contract_id is not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'check_message_type'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages drop constraint check_message_type;
  end if;

  alter table public.messages
    add constraint check_message_type
    check (
      message_type in (
        'text',
        'photo',
        'video',
        'document',
        'post_share',
        'profile_share',
        'calendar_request',
        'location',
        'price',
        'rate',
        'link',
        'post',
        'contract_share'
      )
    );
end $$;

create or replace function public.validate_contract_share_message()
returns trigger
language plpgsql
as $$
declare
  v_creator_id uuid;
  v_counterparty_id uuid;
begin
  if new.message_type = 'contract_share' then
    if new.shared_contract_id is null then
      raise exception 'shared_contract_id est requis pour contract_share';
    end if;

    select c.creator_id, c.counterparty_id
    into v_creator_id, v_counterparty_id
    from public.contracts c
    where c.id = new.shared_contract_id;

    if v_creator_id is null then
      raise exception 'Contrat introuvable pour shared_contract_id=%', new.shared_contract_id;
    end if;

    if new.sender_id <> v_creator_id and new.sender_id <> v_counterparty_id then
      raise exception 'L''expediteur doit etre une partie du contrat';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_contract_share_message on public.messages;
create trigger trg_validate_contract_share_message
before insert or update on public.messages
for each row
execute function public.validate_contract_share_message();
