begin;

do $$
declare
  v_emploi_id uuid;
  v_ecriture_id uuid;
  v_scenariste_id uuid;
begin
  -- Compatibilite selon le slug present en base
  select id into v_emploi_id
  from public.categories
  where slug in ('emploi', 'montage', 'recrutement')
  order by case slug
    when 'emploi' then 1
    when 'montage' then 2
    when 'recrutement' then 3
    else 99
  end
  limit 1;

  if v_emploi_id is null then
    raise exception 'Categorie emploi/montage/recrutement introuvable';
  end if;

  -- Garantir la sous-categorie cible
  insert into public.sub_categories (category_id, name, slug)
  values (v_emploi_id, 'Écriture de contenu', 'ecriture-contenu')
  on conflict (category_id, slug) do update
  set name = excluded.name;

  select id into v_ecriture_id
  from public.sub_categories
  where category_id = v_emploi_id and slug = 'ecriture-contenu'
  limit 1;

  select id into v_scenariste_id
  from public.sub_categories
  where category_id = v_emploi_id and slug = 'scenariste'
  limit 1;

  if v_ecriture_id is null then
    raise exception 'Sous-categorie ecriture-contenu introuvable';
  end if;

  -- Migrer les posts existants
  if v_scenariste_id is not null then
    update public.posts
    set sub_category_id = v_ecriture_id
    where category_id = v_emploi_id
      and sub_category_id = v_scenariste_id;
  end if;

  -- Supprimer la sous-categorie scenariste
  delete from public.sub_categories
  where category_id = v_emploi_id
    and slug = 'scenariste';
end $$;

commit;

-- Verification
select sc.slug, sc.name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug in ('emploi', 'montage', 'recrutement')
order by c.slug, sc.name;
