-- Mise à jour catégorie Emploi : champs responsabilités, compétences et avantages non obligatoires
-- Ces blocs ont été retirés du formulaire de publication (Step4Description) pour la catégorie emploi.
-- Les colonnes restent en base pour compatibilité et données existantes ; elles deviennent optionnelles.

-- S'assurer que les colonnes acceptent NULL (uniquement si elles sont en NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'responsibilities'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE posts ALTER COLUMN responsibilities DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'required_skills'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE posts ALTER COLUMN required_skills DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'benefits'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE posts ALTER COLUMN benefits DROP NOT NULL;
  END IF;
END $$;

-- (Optionnel) Mettre à NULL les champs vides pour les posts emploi déjà en base, pour cohérence
-- Décommenter si vous souhaitez nettoyer les chaînes vides en NULL pour la catégorie emploi :
/*
UPDATE posts p
SET
  responsibilities = NULLIF(TRIM(p.responsibilities), ''),
  required_skills = NULLIF(TRIM(p.required_skills), ''),
  benefits = NULLIF(TRIM(p.benefits), '')
FROM categories c
WHERE p.category_id = c.id
  AND c.slug IN ('emploi', 'montage', 'recrutement');
*/
