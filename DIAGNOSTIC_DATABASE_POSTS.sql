-- ============================================
-- DIAGNOSTIC BASE DE DONNÉES - POSTS TABLE
-- ============================================
-- Vérifie la structure actuelle vs ce qui est nécessaire pour emploi
-- Exécute cette requête dans Supabase SQL Editor

-- 1. VOIR LA STRUCTURE ACTUELLE
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
ORDER BY ordinal_position;

-- Résultat attendu: Liste de colonnes
-- Cherche les colonnes: contract_type, work_schedule, responsibilities, required_skills, benefits

---

-- 2. AJOUTER LES COLONNES EMPLOI SI MANQUANTES
-- Exécute ceci si les colonnes n'existent pas:

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS work_schedule TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Résultat: "0 rows" = colonnes déjà existent, "Succès" = colonnes ajoutées

---

-- 3. STRUCTURE VERSION COMPLÈTE (Vérifier si celle-ci peut remplacer ALL_TABLES.sql)

DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE posts (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Catégorisation
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sub_category_id UUID REFERENCES sub_categories(id) ON DELETE SET NULL,
  
  -- Contenu Principal
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  
  -- Localisation
  location VARCHAR(255),
  location_city VARCHAR(100),
  location_address TEXT,
  location_lat DECIMAL(9, 6),
  location_lng DECIMAL(9, 6),
  location_visible_to_participants_only BOOLEAN DEFAULT false,
  
  -- Médias
  images TEXT[],
  video TEXT,
  media_type VARCHAR(50),
  external_link TEXT,
  document_url TEXT,
  
  -- Prix / Paiement
  price DECIMAL(10, 2),
  payment_type VARCHAR(50),
  exchange_service TEXT,
  revenue_share_percentage DECIMAL(5, 2),
  co_creation_details TEXT,
  
  -- Spécifique EMPLOI ← COLONNES CRITIQUES
  contract_type VARCHAR(50),
  work_schedule TEXT,
  responsibilities TEXT,
  required_skills TEXT,
  benefits TEXT,
  
  -- Dates
  needed_date DATE,
  dateFrom DATE,
  dateTo DATE,
  
  -- Participation
  number_of_people INTEGER,
  duration_minutes INTEGER,
  
  -- État
  is_urgent BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  visibility VARCHAR(20) DEFAULT 'public',
  delivery_available BOOLEAN DEFAULT false,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Modération
  moderation_status VARCHAR(20) DEFAULT 'clean',
  moderation_reason TEXT,
  moderation_score DECIMAL(3, 2),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_sub_category_id ON posts(sub_category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

---

-- 4. VÉRIFIER LES DONNÉES PUBLIÉES

-- Voir les 10 derniers posts
SELECT 
  id,
  title,
  category_id,
  payment_type,
  contract_type,
  price,
  status,
  created_at
FROM posts
ORDER BY created_at DESC
LIMIT 10;

-- Voir spécifiquement les posts emploi
SELECT 
  p.id,
  p.title,
  c.slug as category,
  p.contract_type,
  p.price,
  p.payment_type,
  p.status
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'emploi'
ORDER BY p.created_at DESC
LIMIT 20;

---

-- 5. VÉRIFIER LES COLONNES MANQUANTES DANS UN POST

-- Pour identifier les colonnes NULL (pas remplies)
SELECT 
  id,
  title,
  contract_type IS NULL as missing_contract_type,
  work_schedule IS NULL as missing_work_schedule,
  responsibilities IS NULL as missing_responsibilities,
  required_skills IS NULL as missing_required_skills,
  benefits IS NULL as missing_benefits,
  payment_type IS NULL as missing_payment_type,
  price IS NULL as missing_price
FROM posts
WHERE id = 'UUID_DU_POST_A_VERIFIER'
LIMIT 1;

-- Remplace 'UUID_DU_POST_A_VERIFIER' par un UUID réel

---

-- 6. VÉRIFIER LES CONTRAINTES ET RLS

-- Voir les politiques RLS pour la table posts
SELECT * FROM information_schema.role_routine_grants 
WHERE specific_schema = 'public'
AND specific_name LIKE '%posts%';

-- Voir les RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'posts';

---

-- 7. TESTER L'INSERTION D'UN POST EMPLOI

INSERT INTO posts (
  user_id,
  category_id,
  sub_category_id,
  title,
  description,
  contract_type,
  work_schedule,
  responsibilities,
  required_skills,
  benefits,
  price,
  payment_type,
  location,
  needed_date,
  images,
  status
)
SELECT
  (SELECT id FROM profiles LIMIT 1) as user_id,
  (SELECT id FROM categories WHERE slug = 'emploi' LIMIT 1) as category_id,
  (SELECT id FROM sub_categories WHERE slug = 'montage' LIMIT 1) as sub_category_id,
  'Test Monteur Vidéo' as title,
  'Recherche monteur vidéo expérimenté' as description,
  'freelance' as contract_type,
  '20h/semaine' as work_schedule,
  'Montage vidéo TikTok' as responsibilities,
  'Adobe Premiere Pro' as required_skills,
  'Horaires flexibles' as benefits,
  25 as price,
  'remuneration' as payment_type,
  'Paris' as location,
  CURRENT_DATE + INTERVAL '7 days' as needed_date,
  ARRAY['https://example.com/image.jpg'] as images,
  'active' as status
RETURNING id, title, payment_type, contract_type;

-- C'est un test! Si succès, tu vois l'ID du post créé.

---

-- 8. VÉRIFIER SI LA ROUTE API FONCTIONNE

-- La publication utilise Supabase direct (pas de route API backend)
-- Code Frontend: src/utils/publishHelpers.ts → handlePublish()
--
-- Flux publication:
// 1. Frontend collecte formData
// 2. Valide avec validatePublishForm()
// 3. Récupère category_id et sub_category_id de la BDD
// 4. Construit postData avec toutes les colonnes
// 5. INSERT INTO posts VALUES (...) via Supabase client
// 6. Attend réponse ou erreur
// 7. Affiche message succès/erreur
//
-- Pas de route API - tout direct en frontend!

---

-- 9. VÉRIFIER LES PERMISSIONS RLS

-- Voir si ta requête d'insertion a les permissions
SELECT * FROM auth.users LIMIT 1;

-- Vérifier les policies RLS actives
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY tablename, policyname;

-- Si pas de policies, c'est peut-être trop ouvert!

---

-- 10. RÉSUMÉ DIAGNOSTIQUE

-- Exécute tout ça pour un diagnostic complet:

DO $$
DECLARE
  col_count INT;
  post_count INT;
  emploi_count INT;
BEGIN
  -- Compter colonnes posts
  SELECT COUNT(*) INTO col_count 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'posts';
  
  -- Compter posts totaux
  SELECT COUNT(*) INTO post_count FROM posts;
  
  -- Compter posts emploi
  SELECT COUNT(*) INTO emploi_count 
  FROM posts p 
  LEFT JOIN categories c ON p.category_id = c.id 
  WHERE c.slug = 'emploi';
  
  RAISE NOTICE 'DIAGNOSTIC POSTS TABLE';
  RAISE NOTICE '=====================';
  RAISE NOTICE 'Colonnes dans posts: %', col_count;
  RAISE NOTICE 'Total posts: %', post_count;
  RAISE NOTICE 'Posts emploi: %', emploi_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes clés à vérifier:';
  RAISE NOTICE '✓ contract_type';
  RAISE NOTICE '✓ work_schedule';
  RAISE NOTICE '✓ responsibilities';
  RAISE NOTICE '✓ required_skills';
  RAISE NOTICE '✓ benefits';
END $$;

---

-- NOTES IMPORTANTES:

-- Si les colonnes n'existent pas:
-- → Add them with: ALTER TABLE posts ADD COLUMN IF NOT EXISTS ...

-- Si les tests d'insertion échouent:
-- → Vérifier les RLS policies - peut bloquer l'insertion
-- → Vérifier les FOREIGN KEY constraints

-- Si la publication frontend échoue:
-- → Vérifier console navigateur (F12)
-- → Vérifier Supabase Logs → SQL
-- → Vérifier network tab pour réponse erreur
