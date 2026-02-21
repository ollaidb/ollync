-- Catégorie "studio-lieu":
-- 1) Remplace la sous-catégorie "studio-creation" par "lieu-loisirs"
-- 2) Ajoute la sous-catégorie "lieu-bien-etre"

begin;

do $$
declare
  v_category_id uuid;
  v_old_id uuid;
begin
  select id into v_category_id
  from public.categories
  where slug = 'studio-lieu'
  limit 1;

  if v_category_id is null then
    raise exception 'Categorie studio-lieu introuvable';
  end if;

  -- Renommer l'existant si présent (garde le meme id, donc posts conservés)
  select id into v_old_id
  from public.sub_categories
  where category_id = v_category_id
    and slug = 'studio-creation'
  limit 1;

  if v_old_id is not null then
    update public.sub_categories
    set name = 'Lieu de loisirs',
        slug = 'lieu-loisirs'
    where id = v_old_id;
  else
    insert into public.sub_categories (category_id, name, slug)
    values (v_category_id, 'Lieu de loisirs', 'lieu-loisirs')
    on conflict (category_id, slug) do update
    set name = excluded.name;
  end if;

  -- Ajouter la nouvelle sous-catégorie bien-etre
  insert into public.sub_categories (category_id, name, slug)
  values (v_category_id, 'Lieu de bien-etre', 'lieu-bien-etre')
  on conflict (category_id, slug) do update
  set name = excluded.name;
end $$;

commit;
