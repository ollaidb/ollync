# ⚡ QUICK START - Test Publication Emploi

## 30 Secondes pour Valider la Correction

### ✅ Checklist Rapide

```bash
# 1. Démarrer l'app
npm run dev

# 2. Aller à /publish
# 3. Se connecter si besoin
# 4. Sélectionner "Emploi"
# 5. Sélectionner "Montage" (ou autre)
# 6. Attendre Étape 4...
```

### 🎯 Ce que vous Devez Voir dans Étape 4:

| # | Élément | Status | Note |
|---|---------|--------|------|
| 1 | Label "Type de rémunération *" | ✅ VISIBLE | Pas "Moyen de paiement" |
| 2 | Select affiche "Rémunération" | ✅ PRÉ-REMPLI | Auto-sélectionné |
| 3 | Select est grisé/disabled | ✅ EXPECTED | Une seule option |
| 4 | Champ "Type de contrat" | ✅ VISIBLE | Dropdown CDI/CDD/etc |
| 5 | Champ "Salaire (€)" | ✅ VISIBLE | Nombre à saisir |
| 6 | Champs optionnels | ✅ VISIBLE | Horaires, Missions, etc |
| 7 | Bouton "Continuer" | ✅ ACTIF | Après remplissage |

---

## 🧪 Scénario de Test Express

### Test 1: Default Test (2 minutes)

```
1. Accès: /publish
2. Catégorie: Emploi
3. Sous-catégorie: Montage
4. Étape 4:
   - Titre: "Test Monteur"
   - Type contrat: Freelance
   - Salaire: 25
   - Description: "Test description"
   
5. ✅ Vérifier: Bouton Continuer actif?
6. ✅ Vérifier: Pas de message d'erreur rouge?
7. ✅ Cliquer: Continuer
8. ✅ Vérifier: Va bien à Étape 5?
```

### Test 2: Full Publish (5 minutes)

```
1. Complèter Étape 4 (voir Test 1)
2. Continuer à Étape 5
3. Remplir:
   - Localisation: Paris
   - Date: 2026-02-15
   - Photo: Upload min 1 image
4. Cliquer: "Publier"
5. ✅ Attendre: Message "Annonce publiée"
6. ✅ Vérifier: Redirection OK?
7. ✅ Vérifier: Annonce visible sur /emploi?
```

### Test 3: Database Check (1 minute)

```
1. Supabase Dashboard
2. Aller à: posts table
3. Trouver: Dernière annonce créée
4. Vérifier colonnes:
   ✅ payment_type = 'remuneration'
   ✅ contract_type = 'freelance'
   ✅ price = 25
   ✅ category_id = emploi UUID
   ✅ title = "Test Monteur"
```

---

## 🐛 Si Ça Ne Marche Pas

### Symptôme 1: Bouton Continuer grisé
```
🔍 Diagnostic:
1. Ouvrir F12 → Console
2. Chercher erreurs rouges
3. Vérifier que exchange_type est "remuneration"
4. Tester remplissage de TOUS les champs obligatoires

✅ Solution:
- Recharger page (F5)
- Vérifier formulaire complètement rempli
- Vérifier au moins 1 image uploadée
```

### Symptôme 2: Label toujours "Moyen de paiement"
```
🔍 Diagnostic:
1. Vérifier isJobCategory = true
2. Vérifier selectedCategory.slug = "emploi"
3. Vérifier Code Modifié bien appliqué

✅ Solution:
- Vérifier fichier: src/components/PublishPage/Step4Description.tsx
- Chercher ligne ~152 avec: 'Type de rémunération *'
- Si pas trouvé → redémarrer npm run dev
```

### Symptôme 3: Select "Rémunération" pas disabled
```
🔍 Diagnostic:
1. Vérifier paymentOptions.length === 1
2. Vérifier condition disabled={paymentOptions.length === 1}

✅ Solution:
- Rafraîchir page
- Vérifier pas d'erreurs console
- Tester avec autre catégorie (Vente) pour comparer
```

---

## 📦 Commit Git (Optionnel)

```bash
git add src/components/PublishPage/Step4Description.tsx
git commit -m "Fix: Afficher sélection moyen de paiement pour emploi

- Retirer condition !isJobCategory du select paiement
- Afficher select pour toutes catégories
- Label adaptatif: 'Type de rémunération' pour emploi
- Corriger dépendances useEffect (paymentOptions seulement)
- Auto-sélection 'remuneration' pour emploi fonctionne maintenant

Fixes #ISSUE_EMPLOI_PUBLICATION"
```

---

## 📞 Debugging Avancé

### Console Log: Ajouter Temporairement

```tsx
// Dans Step4Description.tsx, après return <div>
{/* DEBUG: Afficher l'état */}
{process.env.NODE_ENV === 'development' && (
  <div style={{ fontSize: '10px', opacity: 0.5 }}>
    DEBUG: exchange_type={formData.exchange_type}, 
    isJobCategory={isJobCategory}, 
    paymentOptions={JSON.stringify(paymentOptions)}
  </div>
)}
```

### Verificar dans Console (F12)

```javascript
// Dans console navigateur:
// Chercher "DEBUG:" en bas du formulaire

// Ou dans Redux DevTools (si disponible):
// Inspecter formData.exchange_type
// Doit être "remuneration" pour emploi
```

---

## ✅ Checklist de Validation Finale

- [ ] Code modifié sans erreur compilation
- [ ] Emploi + Montage → Voir "Type de rémunération"
- [ ] Select rémunération pré-rempli
- [ ] Champ salaire visible
- [ ] Peut remplir et continuer
- [ ] Peut aller à Étape 5
- [ ] Peut télécharger image et localisation
- [ ] Peut publier
- [ ] Annonce apparaît sur /emploi
- [ ] Base de données: payment_type = 'remuneration'

---

## 🎯 Success Criteria

```
AVANT: ❌ Publication impossible
        - exchange_type vide
        - Validation échoue
        - Bouton continuer désactivé

APRÈS: ✅ Publication possible
        - exchange_type = "remuneration"
        - Validation passe
        - Annonce publiée
        - Visible sur page emploi
```

---

## 🕐 Timeline

| Étape | Durée | Status |
|-------|-------|--------|
| Test Rapide (Test 1) | ~2 min | ✅ COMMENCER ICI |
| Test Complet (Test 2) | ~5 min | ⏭️ Après test 1 |
| Database Verify (Test 3) | ~1 min | ⏭️ Après test 2 |
| **Temps Total** | **~8 min** | Validation complète |

---

**Bon Testing! 🚀**

*Créé: 5 février 2026*
