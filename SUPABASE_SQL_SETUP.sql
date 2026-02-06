-- ============================================
-- SCRIPT SQL À EXÉCUTER DANS SUPABASE
-- ============================================
-- Exécute ces commandes pour vérifier/corriger la base de données
-- Documentation: CODE_EXECUTION_DATABASE.md

---

-- 📋 ÉTAPE 1: VÉRIFIER LA STRUCTURE ACTUELLE

-- Voir TOUTES les colonnes de la table posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
ORDER BY ordinal_position;

-- Résultat attendu: Listez toutes les colonnes
-- Cherchez: contract_type, work_schedule, responsibilities, required_skills, benefits
-- Si absent → Exécutez ÉTAPE 2

---

-- 📋 ÉTAPE 2: AJOUTER LES COLONNES MANQUANTES (SI NÉCESSAIRE)

-- Ajouter les colonnes emploi si elles n'existent pas
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS work_schedule TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Résultat: "Notice: relation already exists" = OK
--           "0 rows" = colonnes déjà ajoutées
--           Si erreur: voir ÉTAPE 6

---

-- 📋 ÉTAPE 3: VÉRIFIER LES CATÉGORIES

-- Vérifier que les catégories existent
SELECT id, name, slug FROM categories;

-- Résultat attendu: 
-- id | name | slug
-- ... | Emploi | emploi
-- ... | Vente | vente
-- ... | Services | services
-- etc.

---

-- 📋 ÉTAPE 4: VÉRIFIER LES SOUS-CATÉGORIES EMPLOI

-- Vérifier que les sous-catégories emploi existent
SELECT 
  sc.id, 
  sc.name, 
  sc.slug, 
  c.slug as category
FROM sub_categories sc
LEFT JOIN categories c ON sc.category_id = c.id
WHERE c.slug = 'emploi'
ORDER BY sc.slug;

-- Résultat attendu:
-- id | name | slug | category
-- ... | Montage | montage | emploi
-- ... | Micro-trottoir | micro-trottoir | emploi
-- ... | Live | live | emploi
-- ... | Écriture de contenu | ecriture-contenu | emploi
-- ... | Autre | autre | emploi

-- Si vides → Exécutez ÉTAPE 5

---

-- 📋 ÉTAPE 5: INSÉRER LES SOUS-CATÉGORIES EMPLOI (SI MANQUANTES)

-- D'abord, récupérer l'ID de la catégorie emploi
DO $$
DECLARE
  emploi_cat_id UUID;
BEGIN
  SELECT id INTO emploi_cat_id FROM categories WHERE slug = 'emploi';
  
  IF emploi_cat_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "emploi" non trouvée!';
  END IF;
  
  -- Ajouter les sous-catégories
  INSERT INTO sub_categories (category_id, name, slug)
  VALUES
    (emploi_cat_id, 'Montage', 'montage'),
    (emploi_cat_id, 'Micro-trottoir', 'micro-trottoir'),
    (emploi_cat_id, 'Live', 'live'),
    (emploi_cat_id, 'Écriture de contenu', 'ecriture-contenu'),
    (emploi_cat_id, 'Autre', 'autre')
  ON CONFLICT (category_id, slug) DO NOTHING;
  
  RAISE NOTICE 'Sous-catégories emploi ajoutées/vérifiées';
END $$;

-- Résultat: "Sous-catégories emploi ajoutées/vérifiées"

---

-- 📋 ÉTAPE 6: TESTER L'INSERTION D'UN POST EMPLOI TEST

-- Créer un post emploi de test
INSERT INTO posts (
  user_id,
  category_id,
  sub_category_id,
  title,
  description,
  content,
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
  (SELECT id FROM categories WHERE slug = 'emploi') as category_id,
  (SELECT id FROM sub_categories WHERE slug = 'montage' LIMIT 1) as sub_category_id,
  'TEST - Monteur Vidéo' as title,
  'Ceci est un post de test pour vérifier que les colonnes emploi fonctionnent' as description,
  'Ceci est un post de test pour vérifier que les colonnes emploi fonctionnent' as content,
  'freelance' as contract_type,
  '20h/semaine' as work_schedule,
  'Montage vidéo pour TikTok' as responsibilities,
  'Adobe Premiere Pro' as required_skills,
  'Horaires flexibles, télétravail' as benefits,
  25 as price,
  'remuneration' as payment_type,
  'Paris' as location,
  CURRENT_DATE + INTERVAL '7 days' as needed_date,
  ARRAY['https://example.com/test-image.jpg'] as images,
  'active' as status
RETURNING id, title, contract_type, payment_type, status;

-- Résultat attendu: Voir l'ID du post créé
-- id | title | contract_type | payment_type | status
-- abc-123... | TEST - Monteur Vidéo | freelance | remuneration | active

---

-- 📋 ÉTAPE 7: VÉRIFIER LE POST TEST

-- Voir le post que nous venons de créer
SELECT 
  id,
  title,
  contract_type,
  work_schedule,
  responsibilities,
  required_skills,
  benefits,
  price,
  payment_type,
  location,
  needed_date,
  status,
  created_at
FROM posts
WHERE title LIKE 'TEST - Monteur%'
LIMIT 1;

-- Résultat attendu: Toutes les colonnes remplies (non NULL)
-- id | title | contract_type | work_schedule | ...
-- abc-123... | TEST - Monteur Vidéo | freelance | 20h/semaine | ...

---

-- 📋 ÉTAPE 8: VOIR LES DERNIERS POSTS

-- Voir les 10 derniers posts
SELECT 
  id,
  title,
  c.slug as category,
  sc.slug as subcategory,
  contract_type,
  price,
  payment_type,
  status,
  created_at
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
ORDER BY created_at DESC
LIMIT 10;

-- Résultat attendu: Voir les posts créés (y compris le TEST)

---

-- 📋 ÉTAPE 9: VOIR LES POSTS EMPLOI UNIQUEMENT

-- Filtrer seulement les posts emploi
SELECT 
  p.id,
  p.title,
  sc.slug as subcategory,
  p.contract_type,
  p.work_schedule,
  p.responsibilities,
  p.required_skills,
  p.benefits,
  p.price,
  p.payment_type,
  p.status,
  p.created_at
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
WHERE c.slug = 'emploi'
ORDER BY p.created_at DESC
LIMIT 20;

-- Résultat attendu: Voir tous les posts emploi avec toutes les colonnes remplies

---

-- 📋 ÉTAPE 10: VÉRIFIER LES RLS POLICIES

-- Voir les policies RLS pour la table posts
SELECT 
  policyname,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;

-- Résultat attendu: Voir les politiques qui contrôlent l'accès
-- Si aucune politique n'apparaît → RLS peut être désactivée
-- Si les politiques incluent INSERT → Bon, l'insertion est autorisée

---

-- 📋 ÉTAPE 11: VÉRIFIER LES FOREIGN KEYS

-- Voir les contraintes de clé étrangère
SELECT
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'posts'
  AND foreign_table_name IS NOT NULL
ORDER BY constraint_name;

-- Résultat attendu:
-- constraint_name | table_name | column_name | foreign_table_name | foreign_column_name
-- posts_category_id_fkey | posts | category_id | categories | id
-- posts_sub_category_id_fkey | posts | sub_category_id | sub_categories | id
-- posts_user_id_fkey | posts | user_id | profiles | id

---

-- 📋 ÉTAPE 12: DIAGNOSTIC COMPLET

-- Diagnostic automatisé
DO $$
DECLARE
  col_contract BOOLEAN;
  col_schedule BOOLEAN;
  col_resp BOOLEAN;
  col_skills BOOLEAN;
  col_benefits BOOLEAN;
  post_count INT;
  emploi_count INT;
  test_count INT;
BEGIN
  -- Vérifier les colonnes
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'contract_type'
  ) INTO col_contract;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'work_schedule'
  ) INTO col_schedule;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'responsibilities'
  ) INTO col_resp;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'required_skills'
  ) INTO col_skills;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'benefits'
  ) INTO col_benefits;
  
  -- Compter les posts
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO emploi_count FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.slug = 'emploi';
  SELECT COUNT(*) INTO test_count FROM posts 
    WHERE title LIKE 'TEST - Monteur%';
  
  -- Afficher le diagnostic
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC BASE DE DONNÉES - POSTS';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'COLONNES EMPLOI:';
  RAISE NOTICE '  contract_type: %', CASE WHEN col_contract THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  work_schedule: %', CASE WHEN col_schedule THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  responsibilities: %', CASE WHEN col_resp THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  required_skills: %', CASE WHEN col_skills THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  benefits: %', CASE WHEN col_benefits THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'STATISTIQUES POSTS:';
  RAISE NOTICE '  Total posts: %', post_count;
  RAISE NOTICE '  Posts emploi: %', emploi_count;
  RAISE NOTICE '  Posts test: %', test_count;
  RAISE NOTICE '';
  IF col_contract AND col_schedule AND col_resp AND col_skills AND col_benefits THEN
    RAISE NOTICE 'STATUS: ✅ TOUTES LES COLONNES EXISTENT';
  ELSE
    RAISE NOTICE 'STATUS: ❌ COLONNES MANQUANTES - Exécutez ÉTAPE 2';
  END IF;
  RAISE NOTICE '════════════════════════════════════════';
END $$;

---

-- 📋 ÉTAPE 13: NETTOYER LE POST TEST

-- Supprimer le post test après vérification
DELETE FROM posts WHERE title LIKE 'TEST - Monteur%';

-- Résultat: "1 row deleted" ou "0 rows deleted"

---

-- 📋 ÉTAPE 14: VÉRIFIER LES TRIGGERS

-- Voir s'il y a des triggers sur la table posts
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'posts'
ORDER BY trigger_name;

-- Résultat attendu: Voir les triggers (s'il y en a)
-- Exemple: updated_at trigger qui met à jour la column updated_at

---

-- 📋 ÉTAPE 15: STORAGE VIDÉOS (BUCKET + POLICIES)

-- Créer/mettre à jour le bucket "videos"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politiques RLS pour le bucket "videos"
DROP POLICY IF EXISTS "Public Access videos" ON storage.objects;
CREATE POLICY "Public Access videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Vérifier le bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'videos';

---

-- 📝 RÉSUMÉ DES ÉTAPES:

-- 1. ✓ Exécuter script en entier
-- 2. ✓ Vérifier ÉTAPE 1 (colonnes existent)
-- 3. ✓ Si manquantes, ÉTAPE 2 les ajoute
-- 4. ✓ ÉTAPE 6 crée un post test
-- 5. ✓ ÉTAPE 7 vérifie le post test
-- 6. ✓ ÉTAPE 12 affiche le diagnostic
-- 7. ✓ ÉTAPE 13 nettoie le post test

-- Si tout est ✓ → La base de données est prête!
-- Si des ✗ → Le diagnostic le montrera

SELECT 'Script exécuté avec succès!' as message;
