# 🗄️ GUIDE - Exécuter les Scripts SQL dans Supabase

## TL;DR - Commandes à Exécuter

1. Supabase Dashboard → **SQL Editor**
2. Copier-coller le contenu de `SUPABASE_SQL_SETUP.sql`
3. Cliquer **RUN** (exécuter)
4. Voir les résultats et corriger si erreurs

---

## 📋 ÉTAPES DÉTAILLÉES

### Étape 1: Ouvrir Supabase Dashboard

```
1. Aller à: https://app.supabase.com
2. Sélectionner ton projet
3. Sélectionner ta région (ex: eu-west-1)
4. Attendre chargement dashboard
```

### Étape 2: Accéder SQL Editor

```
1. Menu gauche → "SQL Editor"
   (Il y a une icône de terminal/carré)
2. Tu vois une liste de requêtes sauvegardées (vide si nouveau)
3. Cliquer "+ New Query" ou commencer à taper directement
```

### Étape 3: Exécuter le Diagnostic

**Copier-coller cette requête d'abord:**

```sql
-- VÉRIFIER LES COLONNES EMPLOI (À exécuter d'abord)
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
  AND column_name IN (
    'contract_type', 'work_schedule', 
    'responsibilities', 'required_skills', 'benefits'
  );
```

**Cliquer le bouton "RUN" (triangle ▶️ noir)**

**Résultat attendu:**
```
5 rows
- contract_type | text
- work_schedule | text
- responsibilities | text
- required_skills | text
- benefits | text
```

**Si 0 rows → Les colonnes n'existent pas, continue Étape 4**

---

### Étape 4: Ajouter les Colonnes Manquantes

**Si résultat était 0 rows, copier-coller:**

```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS work_schedule TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT;
```

**Cliquer "RUN"**

**Résultat attendu:**
```
Success. No rows returned
```

---

### Étape 5: Vérifier les Catégories

```sql
SELECT id, name, slug FROM categories WHERE slug = 'emploi';
```

**Résultat attendu:**
```
1 row
id | name | slug
abc-123... | Emploi | emploi
```

**Si 0 rows → La catégorie emploi n'existe pas**

---

### Étape 6: Vérifier les Sous-catégories Emploi

```sql
SELECT 
  sc.id, 
  sc.name, 
  sc.slug
FROM sub_categories sc
LEFT JOIN categories c ON sc.category_id = c.id
WHERE c.slug = 'emploi'
ORDER BY sc.slug;
```

**Résultat attendu:**
```
5 rows
id | name | slug
... | Montage | montage
... | Micro-trottoir | micro-trottoir
... | Live | live
... | Écriture de contenu | ecriture-contenu
... | Autre | autre
```

**Si 0 rows → Les sous-catégories n'existent pas, voir Étape 7**

---

### Étape 7: Ajouter les Sous-catégories Emploi (si manquantes)

```sql
DO $$
DECLARE
  emploi_cat_id UUID;
BEGIN
  SELECT id INTO emploi_cat_id FROM categories WHERE slug = 'emploi';
  
  INSERT INTO sub_categories (category_id, name, slug)
  VALUES
    (emploi_cat_id, 'Montage', 'montage'),
    (emploi_cat_id, 'Micro-trottoir', 'micro-trottoir'),
    (emploi_cat_id, 'Live', 'live'),
    (emploi_cat_id, 'Écriture de contenu', 'ecriture-contenu'),
    (emploi_cat_id, 'Autre', 'autre')
  ON CONFLICT (category_id, slug) DO NOTHING;
END $$;
```

**Cliquer "RUN"**

**Résultat attendu:**
```
Success. No rows returned
```

---

### Étape 8: Tester l'Insertion d'un Post Emploi

```sql
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
  'TEST - Vérification Structure' as title,
  'Post créé automatiquement pour tester la structure' as description,
  'Post créé automatiquement pour tester la structure' as content,
  'freelance' as contract_type,
  '20h/semaine' as work_schedule,
  'Montage vidéo' as responsibilities,
  'Adobe Premiere' as required_skills,
  'Flex' as benefits,
  25 as price,
  'remuneration' as payment_type,
  'Paris' as location,
  CURRENT_DATE + INTERVAL '7 days' as needed_date,
  ARRAY['https://example.com/test.jpg'] as images,
  'active' as status
RETURNING id, title, contract_type, payment_type;
```

**Cliquer "RUN"**

**Résultat attendu:**
```
1 row created
id | title | contract_type | payment_type
abc-123... | TEST - Vérification Structure | freelance | remuneration
```

**✅ Si succès → Structure OK!**

**❌ Si erreur:**
- `null value in column ... violates not-null constraint` → Manque une colonne NOT NULL
- `insert or update violates foreign key constraint` → UUID invalide
- `permission denied` → RLS policy bloque l'insertion

---

### Étape 9: Vérifier le Post Créé dans Supabase Dashboard

```
1. Menu latéral → "Database"
2. Chercher table "posts"
3. Cliquer sur "posts"
4. Voir les lignes de la table
5. Chercher le post TEST créé
6. Vérifier les colonnes:
   ✓ contract_type = "freelance"
   ✓ work_schedule = "20h/semaine"
   ✓ responsibilities = "Montage vidéo"
   ✓ required_skills = "Adobe Premiere"
   ✓ benefits = "Flex"
```

---

### Étape 10: Nettoyer (Supprimer le Post TEST)

```sql
DELETE FROM posts WHERE title LIKE 'TEST - %';
```

**Cliquer "RUN"**

**Résultat attendu:**
```
1 row deleted
```

---

## 🎯 DIAGNOSTIC COMPLET

Pour exécuter tout le diagnostic d'un coup, copier-coller:

```sql
-- DIAGNOSTIC COMPLET
DO $$
DECLARE
  col_contract BOOLEAN;
  col_schedule BOOLEAN;
  col_resp BOOLEAN;
  col_skills BOOLEAN;
  col_benefits BOOLEAN;
  post_count INT;
  emploi_count INT;
BEGIN
  -- Vérifier les colonnes
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'contract_type'
  ) INTO col_contract;
  
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'work_schedule'
  ) INTO col_schedule;
  
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'responsibilities'
  ) INTO col_resp;
  
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'required_skills'
  ) INTO col_skills;
  
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'benefits'
  ) INTO col_benefits;
  
  -- Compter les posts
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO emploi_count FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.slug = 'emploi';
  
  -- Afficher
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC BASE DE DONNÉES';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Colonnes emploi:';
  RAISE NOTICE '  contract_type: %', CASE WHEN col_contract THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  work_schedule: %', CASE WHEN col_schedule THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  responsibilities: %', CASE WHEN col_resp THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  required_skills: %', CASE WHEN col_skills THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  benefits: %', CASE WHEN col_benefits THEN '✓' ELSE '✗' END;
  RAISE NOTICE 'Statistiques:';
  RAISE NOTICE '  Total posts: %', post_count;
  RAISE NOTICE '  Posts emploi: %', emploi_count;
  IF col_contract AND col_schedule AND col_resp AND col_skills AND col_benefits THEN
    RAISE NOTICE 'STATUS: ✅ OK - Tout existe!';
  ELSE
    RAISE NOTICE 'STATUS: ❌ Manque colonnes';
  END IF;
  RAISE NOTICE '════════════════════════════════════════';
END $$;
```

**Cliquer "RUN"**

**Résultat attendu dans le volet "Output":**
```
✅ Diagnostic affiché avec tous les statuts
```

---

## 📊 Voir les Résultats dans le Dashboard

### Via SQL Editor

1. Exécute cette requête pour voir les posts emploi:
```sql
SELECT 
  p.id, 
  p.title, 
  sc.slug,
  p.contract_type,
  p.work_schedule,
  p.responsibilities,
  p.required_skills,
  p.benefits,
  p.payment_type,
  p.status
FROM posts p
LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'emploi')
LIMIT 20;
```

2. Voir la table directement:
   - Menu → "Database"
   - Chercher "posts"
   - Cliquer pour voir les données
   - Parcourir en horizontal pour voir les colonnes emploi

---

## ⚠️ Erreurs Communes et Solutions

### Erreur: "column does not exist"
```
❌ ERROR: column "contract_type" does not exist
✅ SOLUTION: Exécuter ÉTAPE 4 pour ajouter les colonnes
```

### Erreur: "null value in column"
```
❌ ERROR: null value in column "title" violates not-null constraint
✅ SOLUTION: Vérifier que tu passes une valeur valide pour chaque colonne
```

### Erreur: "permission denied"
```
❌ ERROR: permission denied for relation posts
✅ SOLUTION: Vérifier les RLS policies avec:
   SELECT * FROM pg_policies WHERE tablename = 'posts';
```

### Erreur: "violates check constraint"
```
❌ ERROR: new row for relation posts violates check constraint
✅ SOLUTION: Vérifier les contraintes de la table
```

### Erreur: "foreign key constraint"
```
❌ ERROR: insert violates foreign key constraint
✅ SOLUTION: Vérifier que category_id existe dans categories table
```

---

## 🔄 CHECKLIST COMPLÈTE

- [ ] Ouvrir Supabase Dashboard
- [ ] Aller à SQL Editor
- [ ] Exécuter diagnostic (Étape 3)
- [ ] Si 0 rows → Exécuter Étape 4 (ajouter colonnes)
- [ ] Vérifier catégories (Étape 5)
- [ ] Vérifier sous-catégories (Étape 6)
- [ ] Si 0 rows → Exécuter Étape 7 (ajouter sous-catégories)
- [ ] Tester insertion (Étape 8)
- [ ] Vérifier dans Dashboard (Étape 9)
- [ ] Nettoyer test (Étape 10)
- [ ] ✅ Base de données prête!

---

## 📝 Notes Importantes

1. **Pas de Backend API** → Les requêtes vont directement de Frontend à Supabase
2. **Supabase JavaScript Client** → Utilise les credentials stockées dans le browser
3. **Row Level Security (RLS)** → Contrôle qui peut INSERT/SELECT/UPDATE
4. **Indexes** → Pour performance sur large tables, ajouter après si nécessaire

---

## 🚀 Après Vérification de la BD

Une fois que tout est OK dans la base de données:

1. Revenir au frontend
2. `npm run dev`
3. Tester publication emploi
4. Vérifier que les données sont bien sauvegardées en BDD

---

**Besoin d'aide? Cherche le message d'erreur exact dans ce guide!**
