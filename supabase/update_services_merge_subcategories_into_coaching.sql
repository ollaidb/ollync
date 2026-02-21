-- Reduction des sous-categories "services"
-- Objectif:
-- - garder coaching-contenu et y integrer les usages organisation/analyse/setup dans le texte
-- - supprimer: assistant-createur, organisation, analyse-profil, setup-materiel
-- - migrer les posts existants vers coaching-contenu avant suppression

begin;

do $$
declare
  v_services_id uuid;
  v_coaching_id uuid;
  v_assistant_id uuid;
  v_organisation_id uuid;
  v_analyse_id uuid;
  v_setup_id uuid;
begin
  select id into v_services_id
  from public.categories
  where slug = 'services'
  limit 1;

  if v_services_id is null then
    raise exception 'Categorie services introuvable';
  end if;

  -- S'assurer que coaching-contenu existe
  insert into public.sub_categories (category_id, name, slug)
  values (v_services_id, 'Coaching contenu', 'coaching-contenu')
  on conflict (category_id, slug) do update
  set name = excluded.name;

  select id into v_coaching_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'coaching-contenu'
  limit 1;

  if v_coaching_id is null then
    raise exception 'Sous-categorie coaching-contenu introuvable';
  end if;

  select id into v_assistant_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'assistant-createur'
  limit 1;

  select id into v_organisation_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'organisation'
  limit 1;

  select id into v_analyse_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'analyse-profil'
  limit 1;

  select id into v_setup_id
  from public.sub_categories
  where category_id = v_services_id and slug = 'setup-materiel'
  limit 1;

  -- Migrer les posts des sous-categories a supprimer vers coaching-contenu
  update public.posts
  set sub_category_id = v_coaching_id
  where category_id = v_services_id
    and sub_category_id in (
      coalesce(v_assistant_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_organisation_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_analyse_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_setup_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

  -- Supprimer les sous-categories devenues inutiles
  delete from public.sub_categories
  where category_id = v_services_id
    and slug in ('assistant-createur', 'organisation', 'analyse-profil', 'setup-materiel');
end $$;

commit;

-- Verification
select c.slug as category_slug, sc.slug as subcategory_slug, sc.name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug = 'services'
order by sc.name;
