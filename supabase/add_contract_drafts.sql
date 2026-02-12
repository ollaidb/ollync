-- Persist contract form drafts per user
create table if not exists public.contract_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draft jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists contract_drafts_user_id_key on public.contract_drafts(user_id);

alter table public.contract_drafts enable row level security;

create policy "Contract drafts are readable by owner"
on public.contract_drafts
for select
using (auth.uid() = user_id);

create policy "Contract drafts are insertable by owner"
on public.contract_drafts
for insert
with check (auth.uid() = user_id);

create policy "Contract drafts are updatable by owner"
on public.contract_drafts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Contract drafts are deletable by owner"
on public.contract_drafts
for delete
using (auth.uid() = user_id);
