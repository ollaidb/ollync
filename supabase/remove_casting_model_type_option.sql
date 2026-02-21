-- Suppression de l'ancienne information "Type de modèle recherché"
-- dans les descriptions des annonces Casting.
-- À exécuter une seule fois après le déploiement du front.

BEGIN;

UPDATE public.posts
SET description = trim(
  regexp_replace(
    description,
    E'\\n*\\s*Type de modèle recherché\\s*:\\s*[^\\n\\r]*',
    '',
    'gi'
  )
)
WHERE category_id IN (
  SELECT id FROM public.categories WHERE slug = 'casting-role'
)
AND description ~* 'Type de modèle recherché\\s*:';

COMMIT;

-- Vérification
SELECT COUNT(*) AS remaining_rows_with_model_type
FROM public.posts
WHERE category_id IN (
  SELECT id FROM public.categories WHERE slug = 'casting-role'
)
AND description ~* 'Type de modèle recherché\\s*:';

