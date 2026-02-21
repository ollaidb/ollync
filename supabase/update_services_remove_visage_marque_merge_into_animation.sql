begin;

do $$
declare
  v_services_id uuid;
  v_animation_id uuid;
  v_visage_id uuid;
begin
  select id into v_services_id
  from public.categories
  where slug = 'services'
  limit 1;

  if v_services_id is null then
    raise exception 'Categorie services introuvable';
  end if;

  -- garantir la cible
  insert into public.sub_categories (category_id, name, slug)
  values (v_services_id, 'Animation de compte', 'animation-compte')
  on conflict (category_id, slug) do update
  set name = excluded.name;

  select id into v_animation_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'animation-compte'
  limit 1;

  select id into v_visage_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'visage-marque'
  limit 1;

  if v_animation_id is null then
    raise exception 'Sous-categorie animation-compte introuvable';
  end if;

  -- migrer les posts existants
  if v_visage_id is not null then
    update public.posts
    set sub_category_id = v_animation_id
    where category_id = v_services_id
      and sub_category_id = v_visage_id;
  end if;

  -- supprimer la sous-categorie fusionnee
  delete from public.sub_categories
  where category_id = v_services_id
    and slug = 'visage-marque';
end $$;

commit;

-- verification
select sc.slug, sc.name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug = 'services'
order by sc.name;
