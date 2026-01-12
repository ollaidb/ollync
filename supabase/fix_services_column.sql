-- ============================================
-- MISE À JOUR DE LA COLONNE SERVICES
-- ============================================
-- Ce script vérifie et corrige la structure de la colonne services
-- pour s'assurer qu'elle peut stocker tous les services correctement
-- Date: 2024

-- ============================================
-- ÉTAPE 1 : VÉRIFIER ET CORRIGER LE TYPE DE LA COLONNE
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
            ELSE jsonb_build_object('name', elem::text)  -- String simple -> objet avec name
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
-- ÉTAPE 2 : S'ASSURER QUE LA COLONNE EST EN JSONB
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
  
  RAISE NOTICE '✅ Colonne services vérifiée et corrigée';
END $$;

-- ============================================
-- ÉTAPE 3 : VÉRIFICATION FINALE
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
-- ÉTAPE 4 : STATISTIQUES DES SERVICES
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
ORDER BY services_count DESC;

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
  RAISE NOTICE 'un tableau de services de n''importe quelle taille.';
  RAISE NOTICE '';
  RAISE NOTICE 'Structure attendue pour chaque service:';
  RAISE NOTICE '  {';
  RAISE NOTICE '    "name": "Nom du service",';
  RAISE NOTICE '    "description": "Description du service",';
  RAISE NOTICE '    "payment_type": "price" ou "exchange",';
  RAISE NOTICE '    "value": "Valeur ou montant"';
  RAISE NOTICE '  }';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
