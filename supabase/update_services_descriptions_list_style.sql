-- Alignement DB categorie services (structure)
-- Note: les descriptions affichees (phrases detaillees) sont gerees cote application.

begin;

do $$
declare
  v_services_id uuid;
begin
  select id into v_services_id
  from public.categories
  where slug = 'services'
  limit 1;

  if v_services_id is null then
    raise exception 'Categorie services introuvable';
  end if;

  -- Renommer l'entree agence
  update public.sub_categories
  set name = 'Développement business'
  where category_id = v_services_id
    and slug = 'agence';

  -- Supprimer les anciennes sous-categories qui ne doivent plus apparaitre
  delete from public.sub_categories
  where category_id = v_services_id
    and slug in (
      'strategie-editoriale',
      'proposition-idees',
      'monetisation-audience',
      'aisance-camera'
    );
end $$;

commit;

-- Verification
select sc.slug, sc.name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug = 'services'
order by sc.name;
