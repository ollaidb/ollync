-- Migration : Ajouter la sous-catégorie UGC dans création de contenu
-- UGC = User Generated Content (vidéos courtes, témoignages, tests produit pour les marques)
-- Structure identique au podcast (même type de questions)

begin;

do $$
declare
  v_creation_id uuid;
begin
  -- Récupérer l'id de la catégorie création-contenu
  select id into v_creation_id
  from public.categories
  where slug = 'creation-contenu'
  limit 1;

  if v_creation_id is null then
    raise exception 'Catégorie creation-contenu introuvable';
  end if;

  -- Insérer la sous-catégorie UGC (après podcast, avant court-métrage)
  insert into public.sub_categories (category_id, name, slug)
  values (v_creation_id, 'UGC', 'ugc')
  on conflict (category_id, slug) do update
  set name = excluded.name;
end $$;

commit;

-- Vérification
select sc.slug, sc.name, c.name as category_name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug = 'creation-contenu'
order by sc.name;
