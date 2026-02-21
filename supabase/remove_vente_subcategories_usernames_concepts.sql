-- Supprime "Noms d'utilisateur" et "Concepts / Niches" de la catégorie Vente
-- et réaffecte les posts existants vers la sous-catégorie "Autre".

begin;

with vente_category as (
  select id
  from public.categories
  where slug = 'vente'
  limit 1
),
vente_autre as (
  select sc.id
  from public.sub_categories sc
  join vente_category vc on vc.id = sc.category_id
  where sc.slug = 'autre'
  limit 1
),
subcategories_to_remove as (
  select sc.id
  from public.sub_categories sc
  join vente_category vc on vc.id = sc.category_id
  where sc.slug in ('noms-utilisateur', 'concepts-niches')
)
update public.posts p
set sub_category_id = (select id from vente_autre)
where p.category_id = (select id from vente_category)
  and p.sub_category_id in (select id from subcategories_to_remove)
  and exists (select 1 from vente_autre);

delete from public.sub_categories sc
using public.categories c
where sc.category_id = c.id
  and c.slug = 'vente'
  and sc.slug in ('noms-utilisateur', 'concepts-niches');

commit;
