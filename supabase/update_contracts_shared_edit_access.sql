-- Mise a jour 1/2
-- Objectif: les 2 parties d'un contrat (creator + counterparty)
-- peuvent ouvrir et editer le MEME contrat.

alter table public.contracts enable row level security;

drop policy if exists "Contracts readable by participants" on public.contracts;
drop policy if exists "Contracts insertable by creator" on public.contracts;
drop policy if exists "Contracts updatable by participants" on public.contracts;
drop policy if exists "Contracts deletable by creator" on public.contracts;

create policy "Contracts readable by participants"
on public.contracts
for select
using (
  auth.uid() = creator_id
  or auth.uid() = counterparty_id
);

create policy "Contracts insertable by creator"
on public.contracts
for insert
with check (
  auth.uid() = creator_id
);

create policy "Contracts updatable by participants"
on public.contracts
for update
using (
  auth.uid() = creator_id
  or auth.uid() = counterparty_id
)
with check (
  auth.uid() = creator_id
  or auth.uid() = counterparty_id
);

create policy "Contracts deletable by creator"
on public.contracts
for delete
using (
  auth.uid() = creator_id
);
