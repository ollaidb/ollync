-- ============================================
-- DIAGNOSTIC DES SERVICES DANS LA BASE DE DONNÉES
-- ============================================
-- Ce script vérifie combien de services sont stockés pour chaque utilisateur
-- et identifie les problèmes potentiels

-- 1. Vérifier le type de la colonne services
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

-- 2. Compter le nombre de services pour chaque utilisateur
SELECT 
  id,
  username,
  full_name,
  jsonb_typeof(services) as services_type,
  CASE 
    WHEN services IS NULL THEN 0
    WHEN jsonb_typeof(services) = 'array' THEN jsonb_array_length(services)
    ELSE 0
  END as services_count,
  services
FROM profiles
WHERE services IS NOT NULL 
  AND services != '[]'::jsonb
ORDER BY services_count DESC;

-- 3. Afficher les détails des services pour chaque utilisateur
SELECT 
  id,
  username,
  full_name,
  jsonb_array_length(COALESCE(services, '[]'::jsonb)) as total_services,
  jsonb_pretty(services) as services_details
FROM profiles
WHERE services IS NOT NULL 
  AND services != '[]'::jsonb
ORDER BY jsonb_array_length(COALESCE(services, '[]'::jsonb)) DESC;

-- 4. Vérifier s'il y a des services mal formatés
SELECT 
  id,
  username,
  jsonb_array_length(COALESCE(services, '[]'::jsonb)) as services_count,
  jsonb_array_elements(COALESCE(services, '[]'::jsonb)) as service_item,
  jsonb_typeof(jsonb_array_elements(COALESCE(services, '[]'::jsonb))) as service_type
FROM profiles
WHERE services IS NOT NULL 
  AND services != '[]'::jsonb
  AND jsonb_array_length(COALESCE(services, '[]'::jsonb)) > 0;

-- 5. Vérifier les services qui n'ont pas de nom
SELECT 
  id,
  username,
  jsonb_array_elements(COALESCE(services, '[]'::jsonb))->>'name' as service_name,
  jsonb_array_elements(COALESCE(services, '[]'::jsonb)) as full_service
FROM profiles
WHERE services IS NOT NULL 
  AND services != '[]'::jsonb
  AND (
    jsonb_array_elements(COALESCE(services, '[]'::jsonb))->>'name' IS NULL 
    OR jsonb_array_elements(COALESCE(services, '[]'::jsonb))->>'name' = ''
  );

-- 6. Statistiques globales
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN services IS NOT NULL AND services != '[]'::jsonb THEN 1 END) as profiles_with_services,
  AVG(CASE 
    WHEN services IS NOT NULL AND jsonb_typeof(services) = 'array' 
    THEN jsonb_array_length(services)::numeric 
    ELSE 0 
  END) as avg_services_per_profile,
  MAX(CASE 
    WHEN services IS NOT NULL AND jsonb_typeof(services) = 'array' 
    THEN jsonb_array_length(services) 
    ELSE 0 
  END) as max_services_per_profile
FROM profiles;
