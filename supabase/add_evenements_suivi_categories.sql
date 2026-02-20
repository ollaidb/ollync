-- Ajout des catégories "Événement" et "Suivi" + leurs sous-catégories
-- Exécuter dans Supabase SQL Editor

DO $$
DECLARE
  v_evenements_id uuid;
  v_suivi_id uuid;
BEGIN
  -- Catégorie Événement
  INSERT INTO categories (name, slug, icon, color)
  VALUES ('Événement', 'evenements', 'calendar', '#06b6d4')
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = now();

  SELECT id INTO v_evenements_id
  FROM categories
  WHERE slug = 'evenements'
  LIMIT 1;

  -- Catégorie Suivi
  INSERT INTO categories (name, slug, icon, color)
  VALUES ('Suivi', 'suivi', 'clipboard-list', '#14b8a6')
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = now();

  SELECT id INTO v_suivi_id
  FROM categories
  WHERE slug = 'suivi'
  LIMIT 1;

  -- Sous-catégories Événement
  IF v_evenements_id IS NOT NULL THEN
    INSERT INTO sub_categories (category_id, name, slug)
    VALUES
      (v_evenements_id, 'Masterclass', 'masterclass'),
      (v_evenements_id, 'Conférence', 'conference'),
      (v_evenements_id, 'Débat', 'debat'),
      (v_evenements_id, 'Atelier', 'atelier'),
      (v_evenements_id, 'Autre', 'autre')
    ON CONFLICT (category_id, slug) DO UPDATE
    SET name = EXCLUDED.name;
  END IF;

  -- Sous-catégories Suivi
  IF v_suivi_id IS NOT NULL THEN
    INSERT INTO sub_categories (category_id, name, slug)
    VALUES
      (v_suivi_id, 'Production sur place', 'production-sur-place'),
      (v_suivi_id, 'Voyage / déplacement', 'voyage-deplacement'),
      (v_suivi_id, 'Événement / sortie', 'evenement-sortie'),
      (v_suivi_id, 'Autre', 'autre')
    ON CONFLICT (category_id, slug) DO UPDATE
    SET name = EXCLUDED.name;
  END IF;
END $$;

