-- Catégorie creation-contenu:
-- Supprime les sous-catégories vlog, sketchs, trends
-- et migre les posts existants vers la sous-catégorie video.

begin;

with creation_category as (
  select id
  from public.categories
  where slug = 'creation-contenu'
  limit 1
),
video_subcategory as (
  select sc.id
  from public.sub_categories sc
  join creation_category cc on cc.id = sc.category_id
  where sc.slug = 'video'
  limit 1
),
subcategories_to_remove as (
  select sc.id
  from public.sub_categories sc
  join creation_category cc on cc.id = sc.category_id
  where sc.slug in ('vlog', 'sketchs', 'trends')
)
update public.posts p
set sub_category_id = (select id from video_subcategory)
where p.category_id = (select id from creation_category)
  and p.sub_category_id in (select id from subcategories_to_remove)
  and exists (select 1 from video_subcategory);

delete from public.sub_categories sc
using public.categories c
where sc.category_id = c.id
  and c.slug = 'creation-contenu'
  and sc.slug in ('vlog', 'sketchs', 'trends');

commit;
