-- Migration demandee:
-- 1) Ajouter newsletter + chaine-youtube dans creation-contenu
-- 2) Migrer les posts de projets-equipe (newsletter / youtube) vers creation-contenu
-- 3) Supprimer les categories projets-equipe, poste-service et suivi partout

begin;

DO $$
DECLARE
  v_creation_id uuid;
  v_creation_autre_id uuid;
  v_creation_newsletter_id uuid;
  v_creation_chaine_youtube_id uuid;
  v_projets_equipe_id uuid;
  v_poste_service_id uuid;
  v_suivi_id uuid;
BEGIN
  SELECT id INTO v_creation_id
  FROM public.categories
  WHERE slug = 'creation-contenu'
  LIMIT 1;

  IF v_creation_id IS NULL THEN
    RAISE EXCEPTION 'Categorie creation-contenu introuvable';
  END IF;

  -- Sous-categories cibles dans creation-contenu
  INSERT INTO public.sub_categories (category_id, name, slug)
  VALUES
    (v_creation_id, 'Newsletter', 'newsletter'),
    (v_creation_id, 'Chaîne YouTube', 'chaine-youtube'),
    (v_creation_id, 'Autre', 'autre')
  ON CONFLICT (category_id, slug)
  DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO v_creation_newsletter_id
  FROM public.sub_categories
  WHERE category_id = v_creation_id AND slug = 'newsletter'
  LIMIT 1;

  SELECT id INTO v_creation_chaine_youtube_id
  FROM public.sub_categories
  WHERE category_id = v_creation_id AND slug = 'chaine-youtube'
  LIMIT 1;

  SELECT id INTO v_creation_autre_id
  FROM public.sub_categories
  WHERE category_id = v_creation_id AND slug = 'autre'
  LIMIT 1;

  IF v_creation_newsletter_id IS NULL OR v_creation_chaine_youtube_id IS NULL OR v_creation_autre_id IS NULL THEN
    RAISE EXCEPTION 'Sous-categories cibles introuvables dans creation-contenu';
  END IF;

  SELECT id INTO v_projets_equipe_id
  FROM public.categories
  WHERE slug = 'projets-equipe'
  LIMIT 1;

  SELECT id INTO v_poste_service_id
  FROM public.categories
  WHERE slug = 'poste-service'
  LIMIT 1;

  SELECT id INTO v_suivi_id
  FROM public.categories
  WHERE slug = 'suivi'
  LIMIT 1;

  -- Normaliser d'anciens slugs si deja attaches a creation-contenu
  UPDATE public.posts p
  SET sub_category_id = v_creation_newsletter_id
  FROM public.sub_categories sc
  WHERE p.sub_category_id = sc.id
    AND p.category_id = v_creation_id
    AND sc.slug = 'projet-newsletter';

  UPDATE public.posts p
  SET sub_category_id = v_creation_chaine_youtube_id
  FROM public.sub_categories sc
  WHERE p.sub_category_id = sc.id
    AND p.category_id = v_creation_id
    AND sc.slug = 'projet-youtube';

  -- Migrer projets-equipe -> creation-contenu
  IF v_projets_equipe_id IS NOT NULL THEN
    UPDATE public.posts p
    SET
      category_id = v_creation_id,
      sub_category_id = CASE
        WHEN sc.slug = 'projet-newsletter' THEN v_creation_newsletter_id
        WHEN sc.slug = 'projet-youtube' THEN v_creation_chaine_youtube_id
        ELSE v_creation_autre_id
      END
    FROM public.sub_categories sc
    WHERE p.category_id = v_projets_equipe_id
      AND p.sub_category_id = sc.id;

    UPDATE public.posts
    SET
      category_id = v_creation_id,
      sub_category_id = v_creation_autre_id
    WHERE category_id = v_projets_equipe_id
      AND sub_category_id IS NULL;
  END IF;

  -- Migrer poste-service -> creation-contenu/autre
  IF v_poste_service_id IS NOT NULL THEN
    UPDATE public.posts
    SET
      category_id = v_creation_id,
      sub_category_id = COALESCE(sub_category_id, v_creation_autre_id)
    WHERE category_id = v_poste_service_id;

    UPDATE public.posts p
    SET sub_category_id = v_creation_autre_id
    FROM public.sub_categories sc
    WHERE p.sub_category_id = sc.id
      AND sc.category_id = v_poste_service_id;
  END IF;

  -- Migrer suivi -> creation-contenu/autre
  IF v_suivi_id IS NOT NULL THEN
    UPDATE public.posts
    SET
      category_id = v_creation_id,
      sub_category_id = COALESCE(sub_category_id, v_creation_autre_id)
    WHERE category_id = v_suivi_id;

    UPDATE public.posts p
    SET sub_category_id = v_creation_autre_id
    FROM public.sub_categories sc
    WHERE p.sub_category_id = sc.id
      AND sc.category_id = v_suivi_id;
  END IF;

  -- Nettoyer les categories d'affichage profil
  UPDATE public.profiles
  SET display_categories = array_remove(
    array_remove(
      array_remove(COALESCE(display_categories, ARRAY[]::text[]), 'projets-equipe'),
      'poste-service'
    ),
    'suivi'
  )
  WHERE display_categories IS NOT NULL
    AND (
      'projets-equipe' = ANY(display_categories)
      OR 'poste-service' = ANY(display_categories)
      OR 'suivi' = ANY(display_categories)
    );

  -- Supprimer les 3 categories (disparition globale)
  DELETE FROM public.categories
  WHERE slug IN ('projets-equipe', 'poste-service', 'suivi');
END $$;

commit;

-- Verification rapide
SELECT c.slug, c.name
FROM public.categories c
WHERE c.slug IN ('creation-contenu', 'projets-equipe', 'poste-service', 'suivi')
ORDER BY c.slug;

SELECT sc.slug, sc.name
FROM public.sub_categories sc
JOIN public.categories c ON c.id = sc.category_id
WHERE c.slug = 'creation-contenu'
  AND sc.slug IN ('newsletter', 'chaine-youtube', 'autre')
ORDER BY sc.slug;
