# Code Exécuté - Publication Emploi (Frontend → Base de Données)

## 🔄 Architecture Générale

```
Frontend (React)
    ↓
    Utilisateur remplit formulaire Étape 4
    ↓
    Step4Description.tsx collecte formData
    ↓
    Utilisateur clique "Continuer"
    ↓
    Étape 5 - Step5LocationMedia.tsx
    ↓
    Utilisateur clique "Publier"
    ↓
    Publish.tsx → handlePublish() [src/utils/publishHelpers.ts]
    ↓
    validatePublishForm() - VALIDATION
    ↓
    Récupère category_id et sub_category_id de Supabase
    ↓
    Construit postData avec toutes les colonnes
    ↓
    INSERT INTO posts (Supabase JavaScript Client)
    ↓
    Base de Données (PostgreSQL via Supabase)
    ↓
    Success/Error Response
    ↓
    Affiche message et redirige



```

---

## 📋 TÂCHE 1: COLLECTE DES DONNÉES (Step4Description.tsx)

### Code Frontend - Collecte des Données Emploi

```tsx
// FILE: src/components/PublishPage/Step4Description.tsx
// Cette composante collecte les données du formulaire emploi

// Formulaire Emploi affiche (après correction):
const isJobCategory = (selectedCategory?.slug ?? formData.category) === 'emploi'

// Champs collectés pour emploi:
{
  title: "Monteur Vidéo Recherché",                    // Titre de l'annonce
  description: "Nous cherchons un monteur vidéo...",   // Description du poste
  contract_type: "freelance",                          // ← NOUVEAU pour emploi
  work_schedule: "20h/semaine",                        // ← NOUVEAU pour emploi
  responsibilities: "Montage vidéo TikTok",            // ← NOUVEAU pour emploi
  required_skills: "Adobe Premiere Pro",               // ← NOUVEAU pour emploi
  benefits: "Horaires flexibles",                      // ← NOUVEAU pour emploi
  exchange_type: "remuneration",                       // Auto-sélectionné
  price: "25",                                         // Salaire en €
  location: "Paris",                                   // Localisation
  deadline: "2026-02-15",                              // Date de besoin
  images: ["url/to/image.jpg"],                        // Au moins une photo
  urgent: false,
  visibility: "public"
}

// Validation dans formData.canContinue:
const canContinue = 
  formData.title.trim().length > 0 &&                  // ✓ Titre rempli
  formData.description.trim().length > 0 &&           // ✓ Description rempli
  (!isJobCategory || (
    formData.contract_type && 
    formData.contract_type.trim().length > 0           // ✓ Type contrat rempli (emploi)
  )) &&
  formData.exchange_type.trim().length > 0 &&         // ✓ Rémunération (auto-sélectionné)
  (!requiresPrice || (
    formData.price && 
    parseFloat(formData.price) > 0                     // ✓ Salaire > 0
  )) &&
  (!showSocialNetwork || (
    formData.socialNetwork && 
    formData.socialNetwork.trim().length > 0           // ✓ Réseau social (si requis)
  ))

// Si canContinue = true → Bouton "Continuer" activé

```

---

## 📋 TÂCHE 2: VALIDATION COMPLÈTE (publishHelpers.ts)

### Code Frontend - Validation Avant Publication

```typescript
// FILE: src/utils/publishHelpers.ts (ligne 103-186)
// Cette fonction valide TOUS les champs obligatoires avant d'envoyer à la BDD

export const validatePublishForm = (
  formData: FormData,
  requireSocialNetwork: boolean = false
): ValidationResult => {
  const errors: string[] = []
  const isJobCategory = formData.category === 'emploi'

  // ✓ Catégorie et sous-catégorie
  if (!formData.category) errors.push('La catégorie est obligatoire')
  if (!formData.subcategory) errors.push('La sous-catégorie est obligatoire')

  // ✓ Titre
  if (!formData.title || formData.title.trim().length === 0) 
    errors.push('Le titre est obligatoire')

  // ✓ Description
  if (!formData.description || formData.description.trim().length === 0)
    errors.push('La description est obligatoire')

  // ✓ Type de contrat - EMPLOI ONLY
  if (isJobCategory && (!formData.contract_type || formData.contract_type.trim().length === 0))
    errors.push('Le type de contrat est obligatoire pour un emploi')

  // ✓ Localisation
  if (!formData.location || formData.location.trim().length === 0)
    errors.push('Le lieu est obligatoire')

  // ✓ Date
  if (!formData.deadline || formData.deadline.trim().length === 0)
    errors.push('La date de besoin est obligatoire')

  // ✓ Images
  if (!formData.images || formData.images.length === 0)
    errors.push('Au moins une photo est obligatoire')

  // ✓ Moyen de paiement
  if (!formData.exchange_type || formData.exchange_type.trim().length === 0)
    errors.push('Le moyen de paiement est obligatoire')

  // ✓ Paiement valide pour catégorie
  const allowedPaymentOptions = getPaymentOptionsForCategory(formData.category).map(o => o.id)
  if (formData.exchange_type && !allowedPaymentOptions.includes(formData.exchange_type))
    errors.push('Le moyen de paiement sélectionné n\'est pas disponible pour cette catégorie')

  // ✓ Prix si rémunération
  const paymentConfig = getPaymentOptionConfig(formData.exchange_type)
  if (paymentConfig?.requiresPrice) {
    if (!formData.price || formData.price.trim().length === 0 || parseFloat(formData.price) <= 0)
      errors.push('Le prix est obligatoire pour ce moyen de paiement')
  }

  // ✓ Réseau social si requis
  if (requireSocialNetwork && (!formData.socialNetwork || formData.socialNetwork.trim().length === 0))
    errors.push('Le réseau social est obligatoire')

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Si isValid = false → affiche erreurs et STOP publication
// Si isValid = true → continue vers handlePublish()
```

---

## 📋 TÂCHE 3: RÉCUPÉRATION IDs (handlePublish.ts)

### Code Frontend - Récupère IDs de la BDD

```typescript
// FILE: src/utils/publishHelpers.ts (ligne 257-335)
// Cette partie récupère les IDs de catégorie/sous-catégorie

export const handlePublish = async (
  formData: FormData,
  navigate: (path: string) => void,
  status: 'draft' | 'active',
  showToast?: (message: string) => void,
  existingPostId?: string | null
) => {
  // ... validation omise ...

  // 🔍 ÉTAPE 1: Récupère l'ID de la catégorie depuis son SLUG
  let categoryId: string | null = null
  let subCategoryId: string | null = null

  try {
    // Récupère la catégorie (N1)
    if (!formData.category) throw new Error('Category is required')

    // REQUÊTE #1: Cherche category.id où category.slug = 'emploi'
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', formData.category)  // ← formData.category = 'emploi'
      .single()

    if (categoryData) {
      categoryId = (categoryData as any).id  // ← Récupère l'UUID
      console.log('✓ Category ID récupéré:', categoryId)

      // REQUÊTE #2: Cherche la sous-catégorie
      if (formData.subcategory && formData.subcategory !== 'tout') {
        const { data: subCategoryData } = await (supabase.from('sub_categories') as any)
          .select('id')
          .eq('category_id', categoryId)      // ← Filtre par catégorie
          .eq('slug', formData.subcategory)   // ← formData.subcategory = 'montage'
          .single()

        if (subCategoryData) {
          subCategoryId = (subCategoryData as any).id  // ← Récupère l'UUID
          console.log('✓ SubCategory ID récupéré:', subCategoryId)
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching category/subcategory:', error)
    throw error
  }

  // VALIDATION: categoryId doit exister
  if (!categoryId) {
    alert('Erreur: Catégorie introuvable')
    return
  }

  // Résultat de TÂCHE 3:
  // categoryId = "abc-123-def-456"
  // subCategoryId = "xyz-789-uvw-012"
}
```

---

## 📋 TÂCHE 4: CONSTRUCTION postData (handlePublish.ts)

### Code Frontend - Prépare le POST OBJECT

```typescript
// FILE: src/utils/publishHelpers.ts (ligne 335-420)
// Cette partie construit l'objet postData qui sera inséré en BDD

const postData: any = {
  // Identification et propriétaire
  user_id: user.id,                              // UUID du user connecté
  category_id: categoryId,                       // UUID de catégorie "emploi"
  sub_category_id: subCategoryId,                // UUID de "montage"

  // Contenu principal
  title: formData.title.trim(),                  // "Monteur Vidéo Recherché"
  description: descriptionValue,                 // "Recherche monteur vidéo..."
  content: descriptionValue,                     // Même contenu (pour compatibilité)

  // Localisation
  location: formData.location || null,           // "Paris"

  // Média
  images: formData.images.length > 0 
    ? formData.images 
    : null,                                      // ["url/image.jpg"]

  // Prix et paiement
  price: formData.price 
    ? parseFloat(formData.price) 
    : null,                                      // 25 (en nombre)
  payment_type: formData.exchange_type || null,  // "remuneration"

  // ✅ CHAMPS EMPLOI - CRITIQUES!
  contract_type: formData.contract_type?.trim() || null,        // "freelance"
  work_schedule: formData.work_schedule?.trim() || null,        // "20h/semaine"
  responsibilities: formData.responsibilities?.trim() || null,  // "Montage vidéo"
  required_skills: formData.required_skills?.trim() || null,    // "Adobe Premiere"
  benefits: formData.benefits?.trim() || null,                  // "Horaires flexibles"

  // Dates
  needed_date: formData.deadline || null,        // "2026-02-15"

  // Participation
  number_of_people: formData.maxParticipants 
    ? parseInt(formData.maxParticipants, 10) 
    : null,                                      // 1

  // État
  is_urgent: formData.urgent || false,           // false
  status: finalStatus,                           // "active" ou "pending"

  // Modération
  media_type: (formData.socialNetwork && formData.socialNetwork.trim())
    || (formData.subSubCategory && formData.subSubCategory.trim())
    || (formData.option && formData.option.trim())
    || null,                                     // null pour emploi
  
  moderation_status: moderationResult.shouldBlock ? 'flagged' : 'clean',
  moderation_reason: moderationResult.reasons.length > 0 
    ? moderationResult.reasons.join(',') 
    : null,
  moderation_score: moderationResult.score || 0,
  moderated_at: moderationResult.shouldBlock 
    ? new Date().toISOString() 
    : null
}

// Nettoyer les undefined et chaînes vides
Object.keys(postData).forEach(key => {
  if (postData[key] === undefined || postData[key] === '') {
    delete postData[key]
  }
})

console.log('📦 postData à insérer:', postData)

// Résultat de TÂCHE 4:
postData = {
  user_id: "user-uuid",
  category_id: "emploi-uuid",
  sub_category_id: "montage-uuid",
  title: "Monteur Vidéo Recherché",
  description: "Recherche monteur...",
  content: "Recherche monteur...",
  location: "Paris",
  images: ["url/image.jpg"],
  price: 25,
  payment_type: "remuneration",
  contract_type: "freelance",           // ← EMPLOI
  work_schedule: "20h/semaine",         // ← EMPLOI
  responsibilities: "Montage vidéo",    // ← EMPLOI
  required_skills: "Adobe Premiere",    // ← EMPLOI
  benefits: "Horaires flexibles",       // ← EMPLOI
  needed_date: "2026-02-15",
  number_of_people: 1,
  is_urgent: false,
  status: "active",
  moderation_status: "clean",
  moderation_score: 0
}
```

---

## 📋 TÂCHE 5: INSERTION EN BDD (handlePublish.ts)

### Code Frontend - Envoie le INSERT à Supabase

```typescript
// FILE: src/utils/publishHelpers.ts (ligne 420-461)
// Cette partie envoie les données à la base de données

try {
  const postsTable = supabase.from('posts') as any

  // 📤 REQUÊTE SQL #3: INSERT INTO posts
  const query = existingPostId
    ? postsTable
        .update(postData)                      // ← Mettre à jour si edit
        .eq('id', existingPostId)
        .eq('user_id', user.id)
    : postsTable.insert(postData)              // ← Créer nouveau si publish

  // Attends la réponse du serveur
  const { data, error } = await (query as any)
    .select()
    .single()

  // 🔍 VÉRIFIER LA RÉPONSE
  if (error) {
    console.error('❌ Error publishing post:', error)
    console.error('   Message:', error.message)
    console.error('   Code:', error.code)
    console.error('   Details:', error.details)
    throw error
  }

  // ✅ SUCCÈS
  if (data) {
    console.log('✅ Post publié avec succès!')
    console.log('   ID du post:', (data as any).id)
    console.log('   Status:', (data as any).status)

    const message = status === 'draft'
      ? 'Enregistré'
      : (finalStatus === 'pending' 
        ? 'Annonce en cours de vérification' 
        : 'Annonce publiée')
    
    if (showToast) {
      showToast(message)
    } else {
      alert(message)
    }

    // Redirection
    navigate(`/post/${(data as any).id}`)
  }

} catch (error: any) {
  console.error('❌ Error publishing post:', error)
  alert(`Erreur lors de la publication: ${error.message || 'Erreur inconnue'}`)
}

// Flux SQL réel qui se passe en BDD:
/*
  INSERT INTO posts (
    user_id,
    category_id,
    sub_category_id,
    title,
    description,
    content,
    location,
    images,
    price,
    payment_type,
    contract_type,        ← EMPLOI
    work_schedule,        ← EMPLOI
    responsibilities,     ← EMPLOI
    required_skills,      ← EMPLOI
    benefits,             ← EMPLOI
    needed_date,
    number_of_people,
    is_urgent,
    status,
    moderation_status,
    moderation_score
  ) VALUES (
    'user-uuid',
    'emploi-uuid',
    'montage-uuid',
    'Monteur Vidéo Recherché',
    'Recherche monteur...',
    'Recherche monteur...',
    'Paris',
    '{"url/image.jpg"}',
    25,
    'remuneration',
    'freelance',          ← EMPLOI
    '20h/semaine',        ← EMPLOI
    'Montage vidéo',      ← EMPLOI
    'Adobe Premiere',     ← EMPLOI
    'Horaires flexibles',  ← EMPLOI
    '2026-02-15',
    1,
    false,
    'active',
    'clean',
    0
  ) RETURNING id, title, status;
*/
```

---

## 🗄️ ÉTAPES EN BASE DE DONNÉES

### PostgreSQL - Ce qui se passe réellement

```sql
-- 1. VÉRIFIER QUE LES COLONNES EMPLOI EXISTENT
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
  AND column_name IN (
    'contract_type', 'work_schedule', 
    'responsibilities', 'required_skills', 'benefits'
  );

-- Résultat attendu: 5 colonnes

---

-- 2. INSERTION EFFECTIVE
INSERT INTO posts (
  user_id, category_id, sub_category_id, 
  title, description, content,
  location, images,
  price, payment_type,
  contract_type, work_schedule, 
  responsibilities, required_skills, benefits,
  needed_date, number_of_people,
  is_urgent, status, moderation_status
) VALUES (
  'b6c5d3a2-1234-5678-9abc-def012345678',  -- user_id
  (SELECT id FROM categories WHERE slug = 'emploi'),  -- category_id
  (SELECT id FROM sub_categories WHERE slug = 'montage' AND category_id = (SELECT id FROM categories WHERE slug = 'emploi')),  -- sub_category_id
  'Monteur Vidéo Recherché',  -- title
  'Recherche monteur vidéo expérimenté...',  -- description
  'Recherche monteur vidéo expérimenté...',  -- content
  'Paris',  -- location
  ARRAY['https://example.com/image.jpg'],  -- images
  25,  -- price
  'remuneration',  -- payment_type
  'freelance',  -- contract_type
  '20h/semaine',  -- work_schedule
  'Montage vidéo TikTok et Instagram',  -- responsibilities
  'Adobe Premiere Pro, connaissance TikTok',  -- required_skills
  'Horaires flexibles, télétravail',  -- benefits
  '2026-02-15',  -- needed_date
  1,  -- number_of_people
  false,  -- is_urgent
  'active',  -- status
  'clean'  -- moderation_status
)
RETURNING id, title, created_at;

-- Résultat attendu:
-- id                                   | title                    | created_at
-- ------------------------------------+------------------------+---------------------------
-- 12345678-1234-5678-9abc-def012345678 | Monteur Vidéo Recherché | 2026-02-05 14:30:00+00

---

-- 3. VÉRIFIER QUE LE POST EST CRÉÉ
SELECT 
  id, title, contract_type, price, 
  payment_type, status, created_at
FROM posts
WHERE id = '12345678-1234-5678-9abc-def012345678';

-- Résultat attendu:
-- id | title | contract_type | price | payment_type | status | created_at
-- 12345678... | Monteur Vidéo Recherché | freelance | 25 | remuneration | active | ...

---

-- 4. VÉRIFIER QUE TOUTES LES COLONNES SONT REMPLIES
SELECT 
  contract_type,
  work_schedule,
  responsibilities,
  required_skills,
  benefits
FROM posts
WHERE id = '12345678-1234-5678-9abc-def012345678';

-- Résultat attendu (NON NULL):
-- contract_type | work_schedule | responsibilities | required_skills | benefits
-- freelance | 20h/semaine | Montage vidéo TikTok | Adobe Premiere Pro | Horaires flexibles
```

---

## 🚨 PROBLÈMES POTENTIELS POST-INSERT

### Problème 1: Colonnes N'existent Pas
```
❌ ERROR: column "contract_type" does not exist

✅ SOLUTION: Exécuter:
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS contract_type TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS work_schedule TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS responsibilities TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS required_skills TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS benefits TEXT;
```

### Problème 2: RLS Policy Bloque l'Insertion
```
❌ ERROR: new row violates row-level security policy

✅ SOLUTION: Vérifier les RLS policies:
   SELECT * FROM pg_policies WHERE tablename = 'posts';
   
   S'assurer que user connecté a permission INSERT
```

### Problème 3: FOREIGN KEY Error
```
❌ ERROR: insert or update on table "posts" violates foreign key constraint

✅ SOLUTION: Vérifier que:
   - category_id existe dans categories table
   - sub_category_id existe dans sub_categories table
   - user_id existe dans profiles table
```

### Problème 4: NULL Values
```
❌ ERROR: null value in column "title" violates not-null constraint

✅ SOLUTION: Frontend validation doit vérifier:
   - formData.title.trim().length > 0
   - formData.description.trim().length > 0
```

---

## 📊 RÉSUMÉ DU FLUX COMPLET

```
START: Utilisateur clique "Publier" dans Step 5
  ↓
  [Frontend] Step5LocationMedia.tsx
    onPublish() → handlePublish(formData, 'active')
  ↓
  [Frontend] validatePublishForm(formData)
    ✓ Vérifie: titre, description, localisation, images, paiement
    ✓ Vérifie emploi: type contrat, salaire
    Si erreur → STOP et affiche messages
  ↓
  [Frontend] Récupère IDs de la BDD
    SELECT id FROM categories WHERE slug = 'emploi'
    SELECT id FROM sub_categories WHERE slug = 'montage'
  ↓
  [Frontend] Construit postData object
    {
      user_id, category_id, sub_category_id,
      title, description, location, images, price, payment_type,
      contract_type, work_schedule, responsibilities, required_skills, benefits,
      needed_date, number_of_people, is_urgent, status
    }
  ↓
  [Frontend] Envoie INSERT via Supabase client
    supabase.from('posts').insert(postData).select().single()
  ↓
  [Backend] PostgreSQL reçoit INSERT
    Vérifie contraintes (NOT NULL, FOREIGN KEY, etc.)
    Insère la ligne dans la table posts
    Retourne l'ID du post créé
  ↓
  [Frontend] Reçoit { id, title, status, ... }
    Affiche message "Annonce publiée"
    Redirige vers /post/{id}
  ↓
END: Utilisateur voit son annonce publiée ✅
```

---

## 🔧 COMMANDES POUR DEBUG

### Console Navigateur (F12)
```javascript
// Voir les logs du frontend
window.localStorage.getItem('publishDraftData:...')  // Voir les données du formulaire
window.localStorage.getItem('publishDraftStep:...')  // Voir l'étape actuelle
```

### Supabase Dashboard
```
1. Aller à: Database → posts
2. Voir la dernière annonce créée
3. Vérifier que toutes les colonnes sont remplies
   (contract_type, work_schedule, etc.)
```

### Supabase Logs
```
1. Aller à: Logs → Database
2. Chercher les requêtes INSERT
3. Voir s'il y a des erreurs SQL
```

---

**Cette documentation montre le flux COMPLET de la publication, du frontend jusqu'aux bases de données!**
