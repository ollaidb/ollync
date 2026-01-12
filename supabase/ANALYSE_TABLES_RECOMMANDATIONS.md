# Analyse des Tables pour les Recommandations

## 📋 Règles de Recommandation Demandées

1. **Recommandations basées sur les likes** ✅
2. **Recommandations basées sur les recherches** ⚠️ (partiel)
3. **Recommandations basées sur les actions de l'utilisateur** ✅
4. **Recommandations par catégories** ✅

---

## ✅ Tables Existantes et Fonctionnelles

### Actions Utilisateur Disponibles

#### 1. **Table `likes`** ✅
```sql
- user_id UUID
- post_id UUID
- created_at TIMESTAMP
```
**Utilisation** : Parfait pour les recommandations basées sur les likes
**Status** : ✅ Complet

#### 2. **Table `favorites`** ✅
```sql
- user_id UUID
- post_id UUID
- created_at TIMESTAMP
```
**Utilisation** : Peut être utilisée pour les recommandations (poids plus élevé que les likes)
**Status** : ✅ Complet

#### 3. **Table `interests`** ✅
```sql
- user_id UUID
- post_id UUID
- created_at TIMESTAMP
```
**Utilisation** : Swipe à droite, intérêts exprimés
**Status** : ✅ Complet

#### 4. **Table `comments`** ✅
```sql
- user_id UUID
- post_id UUID
- content TEXT
- created_at TIMESTAMP
```
**Utilisation** : Engagement fort (commenter = intérêt élevé)
**Status** : ✅ Complet

#### 5. **Table `shares`** ✅
```sql
- user_id UUID
- post_id UUID
- created_at TIMESTAMP
```
**Utilisation** : Engagement très fort (partager = intérêt très élevé)
**Status** : ✅ Complet

#### 6. **Table `post_views`** ✅
```sql
- viewer_id UUID
- post_id UUID
- viewed_at TIMESTAMP
```
**Utilisation** : Tracker les vues pour l'engagement
**Status** : ✅ Complet

#### 7. **Table `saved_searches`** ⚠️
```sql
- user_id UUID
- search_query TEXT
- filters JSONB
- created_at TIMESTAMP
```
**Utilisation** : Seulement les recherches **sauvegardées** par l'utilisateur
**Status** : ⚠️ **LIMITÉ** - Ne track pas toutes les recherches effectuées

---

### Tables de Recommandation

#### 8. **Table `recommendation_rules`** ✅
```sql
- name, description
- location_weight, category_weight, interest_weight, views_weight, recency_weight
- consider_likes, consider_interests, consider_favorites
- exclude_user_own_posts, exclude_seen_posts, exclude_swiped_posts
```
**Utilisation** : Règles et pondérations pour l'algorithme
**Status** : ✅ Complet (mais peut-être trop complexe pour l'implémentation actuelle)

#### 9. **Table `user_recommendations`** ✅
```sql
- user_id, post_id, rule_id
- total_score, location_score, category_score, interest_score, views_score, recency_score
- calculated_at, expires_at
```
**Utilisation** : Cache des scores calculés
**Status** : ✅ Complet (mais pas utilisé actuellement)

#### 10. **Table `recommendation_history`** ✅
```sql
- user_id, post_id, rule_id
- position, was_shown, was_clicked, was_liked, was_interested, was_ignored
- score_at_display, shown_at, interacted_at
```
**Utilisation** : Historique pour améliorer l'algorithme
**Status** : ✅ Complet (mais pas utilisé actuellement)

#### 11. **Table `user_algorithm_preferences`** ✅
```sql
- user_id
- preferred_categories, preferred_sub_categories
- override_location_weight, override_category_weight, override_interest_weight
```
**Utilisation** : Préférences personnalisées
**Status** : ✅ Complet (mais pas utilisé actuellement)

---

## ❌ Ce Qui Manque

### 1. **Table `search_history`** ❌ CRITIQUE

**Problème** : Actuellement, seule la table `saved_searches` existe, qui ne track que les recherches **sauvegardées** par l'utilisateur. Pour faire des recommandations basées sur les recherches, il faut tracker **toutes** les recherches effectuées.

**Table nécessaire** :
```sql
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_query TEXT,
  filters JSONB, -- {category_id, sub_category_id, location, price_range, etc.}
  results_count INTEGER, -- Nombre de résultats trouvés
  clicked_post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- Si l'utilisateur a cliqué sur un résultat
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX idx_search_history_filters ON search_history USING GIN(filters);
```

**Utilisation** :
- Analyser les catégories/sous-catégories les plus recherchées
- Recommander des posts similaires aux recherches fréquentes
- Comprendre les préférences de recherche de l'utilisateur

---

## 📊 État Actuel de l'Implémentation

### Ce qui fonctionne ✅
- ✅ Recommandations basées sur les **likes** (implémenté dans `fetchRecommendations.ts`)
- ✅ Recommandations par **catégories** (si like dans une catégorie, recommander dans cette catégorie)
- ✅ Exclusion des posts déjà likés
- ✅ Exclusion des propres posts de l'utilisateur

### Ce qui ne fonctionne pas encore ❌
- ❌ Recommandations basées sur les **recherches** (pas de table `search_history`)
- ❌ Recommandations basées sur les **favorites** (table existe mais pas utilisée)
- ❌ Recommandations basées sur les **interests** (table existe mais pas utilisée)
- ❌ Recommandations basées sur les **comments** (table existe mais pas utilisée)
- ❌ Recommandations basées sur les **shares** (table existe mais pas utilisée)
- ❌ Recommandations basées sur les **vues** (table `post_views` existe mais pas utilisée)

---

## 🔧 Recommandations

### Priorité 1 : Créer la table `search_history`
Pour implémenter les recommandations basées sur les recherches, il faut créer cette table et tracker toutes les recherches.

### Priorité 2 : Enrichir l'algorithme actuel
L'algorithme actuel dans `fetchRecommendations.ts` utilise seulement les likes. Il faudrait l'enrichir pour utiliser aussi :
- `favorites` (poids plus élevé que likes)
- `interests` (swipe à droite)
- `comments` (engagement fort)
- `shares` (engagement très fort)
- `post_views` (pour l'engagement général)

### Priorité 3 : Utiliser les tables de recommandation existantes
Les tables `user_recommendations`, `recommendation_history`, et `user_algorithm_preferences` existent mais ne sont pas utilisées. Elles pourraient améliorer les performances et la personnalisation.

---

## 📝 Conclusion

**Tables suffisantes pour** :
- ✅ Likes
- ✅ Actions utilisateur (favorites, interests, comments, shares, views)
- ✅ Catégories

**Tables manquantes pour** :
- ❌ **Recherches** (besoin de `search_history`)

**Recommandation** : Créer la table `search_history` pour compléter le système de recommandations selon toutes les règles demandées.
