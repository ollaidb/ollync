-- Restructuration categorie services
-- - Branding absorbe: strategie-editoriale + proposition-idees
-- - Developpement business (slug agence) absorbe: monetisation-audience
-- - Coaching contenu absorbe: aisance-camera
-- - Suppression des sous-categories absorbees

begin;

do $$
declare
  v_services_id uuid;
  v_coaching_id uuid;
  v_branding_id uuid;
  v_business_id uuid;
  v_strategie_id uuid;
  v_idees_id uuid;
  v_monetisation_id uuid;
  v_aisance_id uuid;
begin
  select id into v_services_id
  from public.categories
  where slug = 'services'
  limit 1;

  if v_services_id is null then
    raise exception 'Categorie services introuvable';
  end if;

  -- Cibles
  insert into public.sub_categories (category_id, name, slug)
  values
    (v_services_id, 'Coaching contenu', 'coaching-contenu'),
    (v_services_id, 'Branding', 'branding'),
    (v_services_id, 'Développement business', 'agence')
  on conflict (category_id, slug) do update
  set name = excluded.name;

  select id into v_coaching_id from public.sub_categories where category_id = v_services_id and slug = 'coaching-contenu' limit 1;
  select id into v_branding_id from public.sub_categories where category_id = v_services_id and slug = 'branding' limit 1;
  select id into v_business_id from public.sub_categories where category_id = v_services_id and slug = 'agence' limit 1;

  if v_coaching_id is null or v_branding_id is null or v_business_id is null then
    raise exception 'Sous-categories cibles introuvables dans services';
  end if;

  -- Sources a fusionner
  select id into v_strategie_id from public.sub_categories where category_id = v_services_id and slug = 'strategie-editoriale' limit 1;
  select id into v_idees_id from public.sub_categories where category_id = v_services_id and slug = 'proposition-idees' limit 1;
  select id into v_monetisation_id from public.sub_categories where category_id = v_services_id and slug = 'monetisation-audience' limit 1;
  select id into v_aisance_id from public.sub_categories where category_id = v_services_id and slug = 'aisance-camera' limit 1;

  -- Branding <= strategie + idees
  update public.posts
  set sub_category_id = v_branding_id
  where category_id = v_services_id
    and sub_category_id in (
      coalesce(v_strategie_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_idees_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

  -- Developpement business <= monetisation
  update public.posts
  set sub_category_id = v_business_id
  where category_id = v_services_id
    and sub_category_id = coalesce(v_monetisation_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Coaching <= aisance camera
  update public.posts
  set sub_category_id = v_coaching_id
  where category_id = v_services_id
    and sub_category_id = coalesce(v_aisance_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Supprimer les sous-categories absorbees
  delete from public.sub_categories
  where category_id = v_services_id
    and slug in ('strategie-editoriale', 'proposition-idees', 'monetisation-audience', 'aisance-camera');
end $$;

commit;

-- Verification
select sc.slug, sc.name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug = 'services'
order by sc.name;
