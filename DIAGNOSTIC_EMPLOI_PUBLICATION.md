# Diagnostic et Correction - Publication Catégorie Emploi

## Date: 5 février 2026
## Problème identifié: Impossible de publier des annonces dans la catégorie emploi

---

## 🔴 PROBLÈMES DÉCOUVERTS

### Problème Principal - UI Moyen de Paiement Caché
**Fichier:** `src/components/PublishPage/Step4Description.tsx` (ligne 153)
**Issue:** L'interface de sélection du moyen de paiement était conditionnée par `{!isJobCategory && (...)}`
- Pour emploi: Aucune UI pour sélectionner le type de rémunération
- Résultat: Le champ `exchange_type` restait vide
- Validation: échouait car `exchange_type` obligatoire et vide
- Bouton "Continuer": restait désactivé

### Problème Secondaire - Auto-sélection du Moyen de Paiement
**Fichier:** `src/components/PublishPage/Step4Description.tsx` (ligne 79-96)
**Issue:** Le useEffect tentait d'auto-sélectionner `remuneration` pour emploi, mais:
- Dépendances: `[paymentOptions, formData.exchange_type]` - risque de boucle infinie
- Timing: Pouvait ne pas se déclencher au bon moment
- **Correction:** Réduire les dépendances à `[paymentOptions]` seulement

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Affichage du Moyen de Paiement pour Emploi
```tsx
// AVANT - Conditionnel qui cachait le champ pour emploi:
{!isJobCategory && (
  <div className="form-group">
    <label className="form-label">Moyen de paiement *</label>
    {/* ... select ... */}
  </div>
)}

// APRÈS - Visible pour toutes catégories avec label adapté:
<div className="form-group">
  <label className="form-label">
    {isJobCategory ? 'Type de rémunération *' : 'Moyen de paiement *'}
  </label>
  {/* ... select ... */}
</div>
```

### 2. Correction du UseEffect pour Auto-sélection
```tsx
// AVANT - Avait formData.exchange_type dans les dépendances
useEffect(() => {
  // ...
}, [paymentOptions, formData.exchange_type]) // ❌ Problématique

// APRÈS - Dépendances réduites
useEffect(() => {
  // ...
}, [paymentOptions]) // ✅ Correct
```

---

## 📋 CONFIGURATION EMPLOI

### Catégories pour Emploi:
- Montage
- Micro-trottoir
- Live
- Écriture de contenu
- Autre

### Type de Rémunération Unique pour Emploi:
- **Rémunération** (auto-sélectionnée et readonly quand paymentOptions.length === 1)

### Validation Publication Emploi:
Champs obligatoires:
- ✅ Titre
- ✅ Description du poste
- ✅ Lieu
- ✅ Date de besoin
- ✅ Type de contrat (CDI, CDD, Freelance, Stage, Alternance, Intérim, Autre)
- ✅ Salaire (€)
- ✅ Photo (au moins une)
- ✅ Moyen de paiement (Rémunération)

Champs optionnels:
- Horaires/temps de travail
- Missions/responsabilités
- Compétences requises
- Avantages

### Base de Données - Colonnes Posts:
```
- category_id: UUID (obtenu de 'emploi' slug)
- sub_category_id: UUID (ex: montage, micro-trottoir)
- title: TEXT
- description: TEXT
- contract_type: TEXT (CDI, CDD, etc.)
- work_schedule: TEXT
- responsibilities: TEXT
- required_skills: TEXT
- benefits: TEXT
- price: DECIMAL (salaire)
- payment_type: VARCHAR (remuneration)
- needs_date: DATE
- images: TEXT[]
- status: VARCHAR (draft/active/pending)
```

---

## 🧪 ÉTAPES DE TEST POST-CORRECTION

1. **Sélectionner Catégorie "Emploi"**
   - [ ] Les sous-catégories s'affichent
   - [ ] Sélectionner une sous-catégorie (ex: Montage)

2. **Remplir le Formulaire Description (Step 4)**
   - [ ] Voir le label "Type de rémunération *" (pas "Moyen de paiement")
   - [ ] Le select affiche "Rémunération" (auto-sélectionné)
   - [ ] Le select est readonly/disabled (une seule option)
   - [ ] Le champ type de contrat s'affiche
   - [ ] Le champ salaire s'affiche
   - [ ] Les champs optionnels s'affichent

3. **Validation formulaire**
   - [ ] Tous les champs obligatoires peuvent être remplis
   - [ ] Le bouton "Continuer" devient actif
   - [ ] La validation ne bloque pas la progression

4. **Publication Complète**
   - [ ] Remplir localisation et médias (Step 5)
   - [ ] Cliquer "Publier"
   - [ ] Message succès
   - [ ] Annonce visible sur la page emploi

---

## 📊 RÉSUMÉ DES MODIFICATIONS

**Fichiers modifiés:** 1
- ✏️ `src/components/PublishPage/Step4Description.tsx`

**Changements:**
1. Ligne 153: Retiré la condition `{!isJobCategory && (...)}` autour du moyen de paiement
2. Ligne 153-175: Rendu le select de paiement visible pour toutes catégories
3. Ligne 152: Ajouté label conditionnel: "Type de rémunération" pour emploi
4. Ligne 94: Réduit dépendances useEffect à `[paymentOptions]` uniquement

---

## 🔍 VÉRIFICATIONS COMPLÈTES

- [x] Configuration métier: Emploi a seulement "Rémunération"
- [x] Auto-sélection: Remuneration sera auto-sélectionnée quand emploi
- [x] Validation: Tous les champs requis pour emploi sont validés
- [x] UI: Le label s'adapte ("Type de rémunération" vs "Moyen de paiement")
- [x] Disabled state: Select est disabled quand une seule option
- [x] Compatibilité: Les autres catégories continuent à fonctionner

---

## ⚠️ CAS LIMITES À TESTER

1. **Édition d'annonce emploi existante**
   - [ ] La rémunération se recharge correctement
   - [ ] Tous les champs se remplissent

2. **Changement de catégorie**
   - [ ] Passer de Emploi à une autre catégorie
   - [ ] Vérifier que les options de paiement changent

3. **Publication avec tous les champs optionnels**
   - [ ] Horaires
   - [ ] Missions
   - [ ] Compétences
   - [ ] Avantages
   - [ ] Doit être sauvegardée correctement

---

## 📝 NOTES IMPORTANTES

- L'auto-sélection se fait par le `useEffect` qui s'exécute lors du changement de `paymentOptions`
- La rémunération est forcément pour emploi (défini dans `PAYMENT_OPTIONS_BY_CATEGORY['emploi'] = ['remuneration']`)
- Le prix/salaire est obligatoire car le config de rémunération a `requiresPrice: true`
- La description DU POSTE est visible pour emploi (ligne 242-249 du nouveau fichier)

---

## 🚀 PROCHAINES ACTIONS SI LE PROBLÈME PERSISTE

1. Vérifier les logs de Supabase pour les erreurs d'insertion
2. Vérifier la console navigateur pour les erreurs JavaScript
3. Vérifier que les colonnes de la base de données existent (contract_type, etc.)
4. Tester d'autres catégories pour confirmer que c'est spécifique à emploi
