-- Supprime la sous-catégorie "Événements" de "Création de contenu"
-- et évite les références orphelines dans posts.

DO $$
DECLARE
  v_category_id uuid;
  v_subcategory_id uuid;
BEGIN
  SELECT id
  INTO v_category_id
  FROM categories
  WHERE slug = 'creation-contenu'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RAISE NOTICE 'Catégorie creation-contenu introuvable.';
    RETURN;
  END IF;

  SELECT id
  INTO v_subcategory_id
  FROM sub_categories
  WHERE category_id = v_category_id
    AND slug = 'evenements'
  LIMIT 1;

  IF v_subcategory_id IS NULL THEN
    RAISE NOTICE 'Sous-catégorie evenements déjà absente.';
    RETURN;
  END IF;

  UPDATE posts
  SET sub_category_id = NULL
  WHERE sub_category_id = v_subcategory_id;

  DELETE FROM sub_categories
  WHERE id = v_subcategory_id;

  RAISE NOTICE 'Sous-catégorie evenements supprimée.';
END $$;

