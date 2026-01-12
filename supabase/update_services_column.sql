-- ============================================
-- MISE À JOUR DE LA COLONNE SERVICES
-- ============================================
-- Ce script s'assure que la colonne services est correctement configurée
-- pour stocker un tableau JSONB de services avec la structure :
-- {
--   "name": "Titre du service",
--   "description": "Description du service",
--   "payment_type": "price" ou "exchange",
--   "value": "Prix ou description de l'échange"
-- }
-- Date: 2024

-- ============================================
-- ÉTAPE 1 : VÉRIFIER ET CRÉER/CONVERTIR LA COLONNE EN JSONB
-- ============================================
DO $$ 
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'services';
  
  IF current_type IS NULL THEN
    -- La colonne n'existe pas, on la crée en JSONB
    ALTER TABLE profiles ADD COLUMN services JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne services créée en JSONB';
  ELSIF current_type = 'ARRAY' THEN
    -- La colonne est en TEXT[], on doit la convertir en JSONB
    RAISE NOTICE '⚠️  La colonne services est en TEXT[], conversion en JSONB...';
    
    -- Créer une colonne temporaire pour stocker les données JSONB
    ALTER TABLE profiles ADD COLUMN services_jsonb JSONB DEFAULT '[]'::jsonb;
    
    -- Convertir les données existantes : TEXT[] vers JSONB
    UPDATE profiles 
    SET services_jsonb = (
      SELECT COALESCE(
        jsonb_agg(
          CASE 
            WHEN elem::text = 'null' OR elem::text IS NULL THEN NULL
            WHEN elem::text ~ '^{.*}$' THEN elem::jsonb  -- Déjà un JSON
            ELSE jsonb_build_object(
              'name', elem::text,
              'description', '',
              'payment_type', 'price',
              'value', ''
            )  -- String simple -> objet avec structure complète
          END
        ),
        '[]'::jsonb
      )
      FROM unnest(services::text[]) AS elem
    )
    WHERE services IS NOT NULL AND array_length(services, 1) > 0;
    
    -- Supprimer l'ancienne colonne
    ALTER TABLE profiles DROP COLUMN services;
    
    -- Renommer la nouvelle colonne
    ALTER TABLE profiles RENAME COLUMN services_jsonb TO services;
    
    RAISE NOTICE '✅ Colonne services convertie de TEXT[] vers JSONB';
  ELSIF current_type = 'jsonb' OR current_type = 'USER-DEFINED' THEN
    RAISE NOTICE '✅ Colonne services est déjà en JSONB';
  ELSE
    RAISE NOTICE '⚠️  Type inattendu pour services: %', current_type;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : S'ASSURER QUE LA COLONNE EST CORRECTEMENT CONFIGURÉE
-- ============================================
DO $$ 
BEGIN
  -- Si la colonne n'existe toujours pas, la créer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'services'
  ) THEN
    ALTER TABLE profiles ADD COLUMN services JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne services créée en JSONB';
  END IF;
  
  -- S'assurer que la valeur par défaut est un tableau vide
  ALTER TABLE profiles ALTER COLUMN services SET DEFAULT '[]'::jsonb;
  
  -- Mettre à jour les valeurs NULL pour qu'elles deviennent des tableaux vides
  UPDATE profiles 
  SET services = '[]'::jsonb 
  WHERE services IS NULL;
  
  RAISE NOTICE '✅ Colonne services vérifiée et configurée correctement';
END $$;

-- ============================================
-- ÉTAPE 3 : NETTOYER ET NORMALISER LES DONNÉES EXISTANTES
-- ============================================
-- S'assurer que tous les services ont la structure complète
DO $$ 
BEGIN
  UPDATE profiles
  SET services = (
    SELECT COALESCE(
      jsonb_agg(
        CASE 
          WHEN jsonb_typeof(elem) = 'object' THEN
            -- S'assurer que l'objet a tous les champs requis
            jsonb_build_object(
              'name', COALESCE(elem->>'name', ''),
              'description', COALESCE(elem->>'description', ''),
              'payment_type', COALESCE(elem->>'payment_type', 'price'),
              'value', COALESCE(elem->>'value', '')
            )
          WHEN jsonb_typeof(elem) = 'string' THEN
            -- Convertir les strings en objets avec structure complète
            jsonb_build_object(
              'name', elem::text,
              'description', '',
              'payment_type', 'price',
              'value', ''
            )
          ELSE elem
        END
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(COALESCE(services, '[]'::jsonb)) AS elem
  )
  WHERE services IS NOT NULL 
    AND services != '[]'::jsonb
    AND jsonb_array_length(services) > 0;
  
  RAISE NOTICE '✅ Données des services normalisées avec structure complète';
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================
-- Afficher les informations sur la colonne services
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'services';

-- ============================================
-- ÉTAPE 5 : STATISTIQUES DES SERVICES
-- ============================================
-- Afficher le nombre de services par utilisateur
SELECT 
  id,
  username,
  full_name,
  CASE 
    WHEN services IS NULL THEN 0
    WHEN jsonb_typeof(services) = 'array' THEN jsonb_array_length(services)
    ELSE 0
  END as services_count
FROM profiles
WHERE services IS NOT NULL 
  AND services != '[]'::jsonb
ORDER BY services_count DESC
LIMIT 10;

-- ============================================
-- RÉSUMÉ
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MISE À JOUR DE LA COLONNE SERVICES TERMINÉE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'La colonne services est maintenant en JSONB et peut stocker';
  RAISE NOTICE 'un tableau de services de n''importe quelle taille (10, 20, 100, etc.).';
  RAISE NOTICE '';
  RAISE NOTICE 'Structure attendue pour chaque service:';
  RAISE NOTICE '  {';
  RAISE NOTICE '    "name": "Titre/Nom du service",';
  RAISE NOTICE '    "description": "Description du service",';
  RAISE NOTICE '    "payment_type": "price" ou "exchange",';
  RAISE NOTICE '    "value": "Prix ou description de l''échange"';
  RAISE NOTICE '  }';
  RAISE NOTICE '';
  RAISE NOTICE 'Les services peuvent être ajoutés et supprimés librement.';
  RAISE NOTICE 'Quand un service est supprimé dans la page d''édition,';
  RAISE NOTICE 'il est également supprimé de la base de données.';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
