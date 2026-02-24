-- Migration : Supprimer la sous-catégorie magazine-blog et fusionner dans newsletter
-- Les posts magazine-blog sont migrés vers newsletter.
-- La sous-catégorie newsletter existe déjà ; on met à jour son nom/description pour refléter la fusion.
-- Puis on supprime magazine-blog.

begin;

do $$
declare
  v_creation_id uuid;
  v_newsletter_id uuid;
  v_magazine_blog_id uuid;
begin
  -- Récupérer l'id de la catégorie création-contenu
  select id into v_creation_id
  from public.categories
  where slug = 'creation-contenu'
  limit 1;

  if v_creation_id is null then
    raise exception 'Catégorie creation-contenu introuvable';
  end if;

  -- Récupérer les ids des sous-catégories
  select id into v_newsletter_id
  from public.sub_categories
  where category_id = v_creation_id and slug = 'newsletter'
  limit 1;

  select id into v_magazine_blog_id
  from public.sub_categories
  where category_id = v_creation_id and slug = 'magazine-blog'
  limit 1;

  if v_newsletter_id is null then
    raise exception 'Sous-catégorie newsletter introuvable';
  end if;

  -- Mettre à jour le nom de newsletter pour refléter la fusion (newsletter, magazine, blog)
  update public.sub_categories
  set name = 'Newsletter/Magazine/Blog'
  where id = v_newsletter_id;
  -- La description est gérée côté app (pas de colonne description en base si non présente)

  -- Migrer les posts magazine-blog vers newsletter
  if v_magazine_blog_id is not null then
    update public.posts
    set sub_category_id = v_newsletter_id
    where category_id = v_creation_id
      and sub_category_id = v_magazine_blog_id;
  end if;

  -- Supprimer la sous-catégorie magazine-blog
  delete from public.sub_categories
  where category_id = v_creation_id
    and slug = 'magazine-blog';
end $$;

commit;

-- Vérification
select sc.slug, sc.name, c.name as category_name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug = 'creation-contenu'
order by sc.name;
