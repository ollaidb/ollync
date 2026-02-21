-- Déplace certaines sous-catégories de "projets-equipe" vers "creation-contenu"
-- en conservant les annonces existantes (même logique fonctionnelle côté app).
--
-- Déplacements demandés :
-- - projet-magazine + projet-blog -> magazine-blog (Magazine/Blog)
-- - projet-interview + projet-emission -> interview-emission (Interview/Émission)
-- - projet-podcast -> podcast
-- - projet-court-metrage -> court-metrage
-- - projet-media -> media

begin;

do $$
declare
  v_creation_id uuid;
  v_projets_id uuid;
begin
  select id into v_creation_id
  from public.categories
  where slug = 'creation-contenu'
  limit 1;

  select id into v_projets_id
  from public.categories
  where slug = 'projets-equipe'
  limit 1;

  if v_creation_id is null or v_projets_id is null then
    raise exception 'Catégories creation-contenu ou projets-equipe introuvables';
  end if;

  -- Créer/mettre à jour les sous-catégories cibles dans création-contenu
  insert into public.sub_categories (category_id, name, slug) values
    (v_creation_id, 'Interview/Émission', 'interview-emission'),
    (v_creation_id, 'Podcast', 'podcast'),
    (v_creation_id, 'Court-métrage', 'court-metrage'),
    (v_creation_id, 'Magazine/Blog', 'magazine-blog'),
    (v_creation_id, 'Média', 'media')
  on conflict (category_id, slug) do update
  set name = excluded.name;

  -- Map des IDs source -> cible
  with map as (
    select
      src.id as src_id,
      tgt.id as tgt_id
    from public.sub_categories src
    join public.sub_categories tgt on tgt.category_id = v_creation_id
    where src.category_id = v_projets_id
      and (
        (src.slug in ('projet-magazine', 'projet-blog') and tgt.slug = 'magazine-blog') or
        (src.slug in ('projet-interview', 'projet-emission') and tgt.slug = 'interview-emission') or
        (src.slug = 'projet-podcast' and tgt.slug = 'podcast') or
        (src.slug = 'projet-court-metrage' and tgt.slug = 'court-metrage') or
        (src.slug = 'projet-media' and tgt.slug = 'media')
      )
  )
  update public.posts p
  set
    category_id = v_creation_id,
    sub_category_id = map.tgt_id
  from map
  where p.category_id = v_projets_id
    and p.sub_category_id = map.src_id;

  -- Supprimer les anciennes sous-catégories source dans projets-equipe
  delete from public.sub_categories
  where category_id = v_projets_id
    and slug in (
      'projet-magazine',
      'projet-blog',
      'projet-interview',
      'projet-emission',
      'projet-podcast',
      'projet-court-metrage',
      'projet-media'
    );
end $$;

commit;
