-- Supprime les moyens de paiement "association" et "partage-revenus"
-- et migre les anciennes données vers des types encore actifs.
-- Mapping appliqué :
--   association      -> co-creation
--   partage-revenus  -> remuneration

begin;

-- 1) Posts publiés
update public.posts
set payment_type = case
  when payment_type = 'association' then 'co-creation'
  when payment_type = 'partage-revenus' then 'remuneration'
  else payment_type
end
where payment_type in ('association', 'partage-revenus');

-- 2) Contrats (type de paiement + type de contrat)
update public.contracts
set payment_type = case
  when payment_type = 'association' then 'co-creation'
  when payment_type = 'partage-revenus' then 'remuneration'
  else payment_type
end
where payment_type in ('association', 'partage-revenus');

update public.contracts
set contract_type = case
  when contract_type = 'association' then 'co-creation'
  when contract_type = 'partage-revenus' then 'remuneration'
  else contract_type
end
where contract_type in ('association', 'partage-revenus');

-- 3) Profils lieu : tableau venue_payment_types (TEXT[])
-- Gère aussi les valeurs avec suffixe "type|valeur" (ex: remuneration|25)
update public.profiles p
set venue_payment_types = coalesce((
  select array_agg(distinct mapped_item) filter (where mapped_item is not null)
  from (
    select case
      when split_part(raw_item, '|', 1) = 'association'
        then concat('co-creation', case when raw_item like '%|%' then '|' || split_part(raw_item, '|', 2) else '' end)
      when split_part(raw_item, '|', 1) = 'partage-revenus'
        then concat('remuneration', case when raw_item like '%|%' then '|' || split_part(raw_item, '|', 2) else '' end)
      else raw_item
    end as mapped_item
    from unnest(coalesce(p.venue_payment_types, '{}'::text[])) as t(raw_item)
  ) mapped
), '{}'::text[])
where exists (
  select 1
  from unnest(coalesce(p.venue_payment_types, '{}'::text[])) as t(raw_item)
  where split_part(raw_item, '|', 1) in ('association', 'partage-revenus')
);

-- 4) Services profil (JSONB): payment_type dans chaque objet
update public.profiles
set services = (
  select jsonb_agg(
    case
      when jsonb_typeof(item) = 'object' then
        jsonb_set(
          item,
          '{payment_type}',
          to_jsonb(
            case
              when item->>'payment_type' = 'association' then 'co-creation'
              when item->>'payment_type' = 'partage-revenus' then 'remuneration'
              else coalesce(item->>'payment_type', 'remuneration')
            end
          ),
          true
        )
      else item
    end
  )
  from jsonb_array_elements(services) as item
)
where services is not null
  and jsonb_typeof(services) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(services) as item
    where jsonb_typeof(item) = 'object'
      and item->>'payment_type' in ('association', 'partage-revenus')
  );

commit;
