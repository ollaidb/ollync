-- ============================================
-- SCRIPT COMPLET - CRÉATION EMPLOI + COLONNES
-- ============================================
-- Exécute ce script pour:
-- 1. Créer la catégorie "emploi"
-- 2. Créer les sous-catégories emploi
-- 3. Ajouter les colonnes emploi
-- 4. Vérifier la structure

---

-- 📋 ÉTAPE 1: VÉRIFIER LES CATÉGORIES EXISTANTES

SELECT id, name, slug FROM categories;

-- Tu devrais voir: creation-contenu, casting-role, studio-lieu, projets-equipe, services, vente
-- Mais PAS "emploi" → C'est le problème!

---

-- 📋 ÉTAPE 2: CRÉER LA CATÉGORIE "EMPLOI" (SI MANQUANTE)

INSERT INTO categories (name, slug, icon, color)
VALUES (
  'Emploi',
  'emploi',
  'Scissors',  -- Icon de Lucide
  '#9c27b0'    -- Couleur violet
)
ON CONFLICT (slug) DO NOTHING;

-- Résultat: "1 row inserted" ou "0 rows" si déjà existe

---

-- 📋 ÉTAPE 3: AJOUTER LES COLONNES EMPLOI À LA TABLE POSTS

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS work_schedule TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Résultat: "Success" ou notice

---

-- 📋 ÉTAPE 4: RÉCUPÉRER L'ID DE LA CATÉGORIE "EMPLOI"

-- Voir l'ID qu'on vient de créer
SELECT id, name, slug FROM categories WHERE slug = 'emploi';

-- Noter cet ID (ex: abc-123-def-456)

---

-- 📋 ÉTAPE 5: CRÉER LES SOUS-CATÉGORIES EMPLOI

-- IMPORTANT: Remplace 'UUID_EMPLOI_ICI' par l'ID récupéré à l'étape 4
-- OU exécute ce script qui le fait automatiquement:

DO $$
DECLARE
  emploi_cat_id UUID;
BEGIN
  -- Récupérer l'ID de la catégorie emploi
  SELECT id INTO emploi_cat_id FROM categories WHERE slug = 'emploi';
  
  IF emploi_cat_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "emploi" encore introuvable! Vérifiez ÉTAPE 2.';
  END IF;
  
  -- Créer les sous-catégories emploi
  INSERT INTO sub_categories (category_id, name, slug)
  VALUES
    (emploi_cat_id, 'Montage', 'montage'),
    (emploi_cat_id, 'Micro-trottoir', 'micro-trottoir'),
    (emploi_cat_id, 'Live', 'live'),
    (emploi_cat_id, 'Écriture de contenu', 'ecriture-contenu'),
    (emploi_cat_id, 'Autre', 'autre')
  ON CONFLICT (category_id, slug) DO NOTHING;
  
  RAISE NOTICE 'Sous-catégories emploi créées/vérifiées: 5 catégories';
END $$;

-- Résultat: "Sous-catégories emploi créées/vérifiées: 5 catégories"

---

-- 📋 ÉTAPE 6: VÉRIFIER LES SOUS-CATÉGORIES EMPLOI

SELECT 
  id, 
  name, 
  slug,
  category_id
FROM sub_categories
WHERE category_id = (SELECT id FROM categories WHERE slug = 'emploi')
ORDER BY slug;

-- Résultat attendu: 5 sous-catégories
-- montage, micro-trottoir, live, ecriture-contenu, autre

---

-- 📋 ÉTAPE 7: VÉRIFIER LES COLONNES EMPLOI

SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
  AND column_name IN (
    'contract_type', 'work_schedule', 
    'responsibilities', 'required_skills', 'benefits'
  )
ORDER BY column_name;

-- Résultat attendu: 5 colonnes (text type)

---

-- 📋 ÉTAPE 8: TESTER L'INSERTION D'UN POST EMPLOI

-- Créer un post de test pour vérifier que tout fonctionne
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
  'TEST - Monteur Vidéo (Structure OK)' as title,
  'Ceci est un post de test pour vérifier que les colonnes emploi fonctionnent correctement.' as description,
  'Ceci est un post de test pour vérifier que les colonnes emploi fonctionnent correctement.' as content,
  'freelance' as contract_type,
  '20h/semaine, flexible' as work_schedule,
  'Montage vidéo pour TikTok, Instagram Reels, YouTube Shorts' as responsibilities,
  'Adobe Premiere Pro, After Effects, montage rapide' as required_skills,
  'Horaires flexibles, télétravail possible, projets variés' as benefits,
  25 as price,
  'remuneration' as payment_type,
  'Télétravail' as location,
  CURRENT_DATE + INTERVAL '7 days' as needed_date,
  ARRAY['https://example.com/test-image.jpg'] as images,
  'active' as status
RETURNING id, title, contract_type, payment_type, status;

-- Résultat attendu:
-- ✅ id | title | contract_type | payment_type | status
-- ✅ abc-123... | TEST - Monteur... | freelance | remuneration | active

---

-- 📋 ÉTAPE 9: VÉRIFIER LE POST TEST

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
  status,
  created_at
FROM posts
WHERE title LIKE 'TEST - Monteur%'
LIMIT 1;

-- Résultat: Voir toutes les colonnes remplies avec les valeurs du test

---

-- 📋 ÉTAPE 10: VOIR LES POSTS EMPLOI

SELECT 
  p.id,
  p.title,
  c.slug as category,
  sc.slug as subcategory,
  p.contract_type,
  p.work_schedule,
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

-- Résultat: Voir tous les posts emploi (y compris le TEST)

---

-- 📋 ÉTAPE 11: DIAGNOSTIC FINAL

DO $$
DECLARE
  col_contract BOOLEAN;
  col_schedule BOOLEAN;
  col_resp BOOLEAN;
  col_skills BOOLEAN;
  col_benefits BOOLEAN;
  emploi_exists BOOLEAN;
  emploi_subcat_count INT;
  post_count INT;
  emploi_count INT;
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
  
  -- Vérifier catégories
  SELECT EXISTS(
    SELECT 1 FROM categories WHERE slug = 'emploi'
  ) INTO emploi_exists;
  
  -- Compter sous-catégories emploi
  SELECT COUNT(*) INTO emploi_subcat_count FROM sub_categories 
    WHERE category_id = (SELECT id FROM categories WHERE slug = 'emploi');
  
  -- Compter posts
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO emploi_count FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.slug = 'emploi';
  
  -- Afficher diagnostic
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC BASE DE DONNÉES - EMPLOI';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '1. CATÉGORIES ET SOUS-CATÉGORIES:';
  RAISE NOTICE '   Catégorie "emploi" existe: %', CASE WHEN emploi_exists THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '   Sous-catégories emploi: % / 5', emploi_subcat_count;
  RAISE NOTICE '';
  RAISE NOTICE '2. COLONNES EMPLOI DANS TABLE POSTS:';
  RAISE NOTICE '   contract_type: %', CASE WHEN col_contract THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '   work_schedule: %', CASE WHEN col_schedule THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '   responsibilities: %', CASE WHEN col_resp THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '   required_skills: %', CASE WHEN col_skills THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '   benefits: %', CASE WHEN col_benefits THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '';
  RAISE NOTICE '3. STATISTIQUES POSTS:';
  RAISE NOTICE '   Total posts: %', post_count;
  RAISE NOTICE '   Posts emploi: %', emploi_count;
  RAISE NOTICE '';
  IF emploi_exists AND emploi_subcat_count = 5 AND col_contract AND col_schedule AND col_resp AND col_skills AND col_benefits THEN
    RAISE NOTICE 'STATUS: ✅✅✅ TOUT EST OK! - Prêt pour publication emploi';
  ELSE
    RAISE NOTICE 'STATUS: ❌ Problèmes détectés - voir détails ci-dessus';
  END IF;
  RAISE NOTICE '════════════════════════════════════════';
END $$;

---

-- 📋 ÉTAPE 12: NETTOYER LE POST TEST (OPTIONNEL)

-- Supprimer le post test après vérification
DELETE FROM posts WHERE title LIKE 'TEST - Monteur%';

-- Résultat: "1 row deleted"

---

-- ✅ FIN DU SCRIPT
-- Si le diagnostic montre ✅✅✅, la publication emploi est maintenant fonctionnelle!

SELECT 'Script exécuté avec succès!' as message;
