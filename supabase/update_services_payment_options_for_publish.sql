-- Mise a jour services: aligner les moyens de paiement autorises
-- UI/Validation autorisent maintenant pour "services":
-- participation, co-creation, remuneration, echange, visibilite-contre-service
--
-- Ce script harmonise uniquement les anciennes lignes invalides.

begin;

-- 1) Posts categorie services: normaliser payment_type invalide -> remuneration
update public.posts p
set payment_type = 'remuneration'
where p.category_id in (
  select c.id from public.categories c where c.slug = 'services'
)
and (
  p.payment_type is null
  or p.payment_type not in (
    'participation',
    'co-creation',
    'remuneration',
    'echange',
    'visibilite-contre-service'
  )
);

-- 2) Match requests liees a des posts services: normaliser si invalide
update public.match_requests mr
set related_service_payment_type = 'remuneration'
where mr.related_post_id in (
  select p.id
  from public.posts p
  join public.categories c on c.id = p.category_id
  where c.slug = 'services'
)
and (
  mr.related_service_payment_type is null
  or mr.related_service_payment_type not in (
    'participation',
    'co-creation',
    'remuneration',
    'echange',
    'visibilite-contre-service'
  )
);

commit;
