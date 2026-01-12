-- ============================================
-- CORRECTION DE LA STRUCTURE DE LA COLONNE SERVICES
-- ============================================
-- Ce script normalise la colonne services pour utiliser JSONB
-- et convertit les données existantes si nécessaire
-- Date: 2024

-- ============================================
-- ÉTAPE 1 : VÉRIFIER LE TYPE ACTUEL DE LA COLONNE
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
    -- Si c'est un tableau de strings, on les convertit en objets simples avec juste "name"
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
  
  -- Vérifier que c'est bien JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'services'
      AND (data_type != 'jsonb' AND udt_name != 'jsonb')
  ) THEN
    RAISE EXCEPTION 'La colonne services n''est pas en JSONB après conversion';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : NETTOYER LES DONNÉES EXISTANTES
-- ============================================
-- Normaliser les services pour qu'ils aient toujours la structure attendue
-- Structure attendue : { name: string, description: string, payment_type: 'price'|'exchange', value: string }

DO $$ 
BEGIN
  -- Mettre à jour les services qui sont des strings simples pour les convertir en objets
  UPDATE profiles
  SET services = (
    SELECT COALESCE(
      jsonb_agg(
        CASE 
          WHEN jsonb_typeof(elem) = 'string' THEN
            jsonb_build_object(
              'name', elem::text,
              'description', '',
              'payment_type', 'price',
              'value', ''
            )
          WHEN jsonb_typeof(elem) = 'object' THEN
            -- S'assurer que l'objet a tous les champs requis
            jsonb_build_object(
              'name', COALESCE(elem->>'name', ''),
              'description', COALESCE(elem->>'description', ''),
              'payment_type', COALESCE(elem->>'payment_type', 'price'),
              'value', COALESCE(elem->>'value', '')
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
  
  RAISE NOTICE '✅ Données des services normalisées';
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================
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
-- ÉTAPE 5 : AFFICHER UN EXEMPLE DES DONNÉES
-- ============================================
SELECT 
  id,
  username,
  services,
  jsonb_typeof(services) as services_type,
  jsonb_array_length(COALESCE(services, '[]'::jsonb)) as services_count
FROM profiles
WHERE services IS NOT NULL 
  AND services != '[]'::jsonb
LIMIT 5;

-- ============================================
-- RÉSUMÉ
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTION DE LA COLONNE SERVICES TERMINÉE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Structure attendue pour les services:';
  RAISE NOTICE '';
  RAISE NOTICE '  [
  RAISE NOTICE '    {
  RAISE NOTICE '      "name": "Nom du service",
  RAISE NOTICE '      "description": "Description optionnelle",
  RAISE NOTICE '      "payment_type": "price" ou "exchange",
  RAISE NOTICE '      "value": "Prix ou description de l''échange"
  RAISE NOTICE '    }
  RAISE NOTICE '  ]';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;