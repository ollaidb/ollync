# Résumé du Nettoyage des Tables

## 📋 Vue d'Ensemble

Une analyse complète a été effectuée sur toutes les tables de la base de données Ollync. 

### Résultats
- **27 tables à conserver** (utilisées dans le code ou prévues pour des fonctionnalités)
- **10 tables à supprimer** (non utilisées et redondantes)
- **1 nouvelle table à créer** (table de recommandation simplifiée)

---

## ✅ Tables à CONSERVER (27 tables)

### Tables Principales (15)
1. `categories` - Catégories principales
2. `profiles` - Profils utilisateurs
3. `sub_categories` - Sous-catégories
4. `posts` - Annonces/publications
5. `likes` - Likes sur les annonces
6. `favorites` - Favoris des utilisateurs
7. `comments` - Commentaires/réponses
8. `applications` - Candidatures pour les annonces
9. `follows` - Abonnements entre utilisateurs
10. `conversations` - Conversations entre utilisateurs
11. `conversation_participants` - Participants aux conversations de groupe
12. `messages` - Messages dans les conversations
13. `notifications` - Notifications des utilisateurs
14. `matches` - Matches entre utilisateurs
15. `match_requests` - Demandes de match

### Tables de Matching/Swipe (3)
16. `interests` - Swipe à droite (intérêts exprimés)
17. `ignored_posts` - Posts ignorés (swipe à gauche)
18. `user_interests` - Centres d'intérêt (catégories préférées)

### Tables de Messagerie Avancée (4)
19. `message_likes` - Likes sur les messages
20. `message_reports` - Signalements de messages
21. `message_reads` - Lectures de messages dans les groupes
22. `user_blocks` - Blocages d'utilisateurs (à implémenter)
23. `conversation_preferences` - Préférences de conversation (à implémenter)

### Tables Diverses (4)
24. `saved_searches` - Recherches sauvegardées
25. `reports` - Signalements (posts, utilisateurs, commentaires)
26. `ratings` - Avis/ratings entre utilisateurs
27. `user_recommendations` - **NOUVELLE** table de recommandation simplifiée

---

## ❌ Tables à SUPPRIMER (10 tables)

### Tables de Recommandation Redondantes (4)
1. `recommendation_rules` ❌ - Règles de l'algorithme (non utilisée)
2. `user_recommendations` ❌ - Ancienne version complexe (remplacée par nouvelle version)
3. `recommendation_history` ❌ - Historique (non utilisée)
4. `user_algorithm_preferences` ❌ - Préférences (non utilisée)

### Tables Non Utilisées (6)
5. `search_history` ❌ - Historique de recherche (créée mais jamais utilisée)
6. `shares` ❌ - Partages d'annonces (définie mais pas utilisée)
7. `user_settings` ❌ - Paramètres utilisateur (définie mais pas utilisée)
8. `post_views` ❌ - Vues détaillées (redondant avec posts.views_count)
9. `tags` ❌ - Tags (fonctionnalité non implémentée)
10. `post_tags` ❌ - Liaison posts-tags (fonctionnalité non implémentée)
11. `transactions` ❌ - Transactions financières (fonctionnalité non implémentée)

---

## 🆕 Nouvelle Table à CRÉER

### `user_recommendations` (Version Simplifiée)

Cette table unique remplace les 4 tables de recommandation précédentes.

**Structure:**
- `id` - Identifiant unique
- `user_id` - Utilisateur
- `post_id` - Post recommandé
- `score` - Score de recommandation (0-100)
- `reason` - Raison de la recommandation (ex: "Basé sur vos likes")
- `recommendation_type` - Type (algorithm, trending, similar, location)
- `created_at` - Date de création
- `updated_at` - Date de mise à jour

**Avantages:**
- ✅ Table unique et simple
- ✅ Facile à utiliser et maintenir
- ✅ Toute l'historique peut être conservé (en gardant les anciennes entrées)
- ✅ Permet de tracer l'évolution des recommandations

---

## 📝 Scripts SQL Créés

### 1. `supabase/cleanup_unused_tables.sql`
Script pour supprimer toutes les tables non utilisées.

**⚠️ ATTENTION : Faites un backup avant d'exécuter ce script en production !**

### 2. `supabase/create_user_recommendations_table.sql`
Script pour créer la nouvelle table de recommandation simplifiée.

---

## 🚀 Ordre d'Exécution

### Étape 1 : Backup
```sql
-- Faites un backup complet de votre base de données avant de continuer
```

### Étape 2 : Supprimer les tables non utilisées
```sql
-- Exécutez dans Supabase SQL Editor:
-- supabase/cleanup_unused_tables.sql
```

### Étape 3 : Créer la nouvelle table de recommandation
```sql
-- Exécutez dans Supabase SQL Editor:
-- supabase/create_user_recommendations_table.sql
```

### Étape 4 : Vérification
Vérifiez que toutes les tables importantes sont toujours présentes et que la nouvelle table a été créée.

---

## 📊 Statistiques

- **Tables avant nettoyage** : ~38 tables
- **Tables après nettoyage** : 27 tables
- **Tables supprimées** : 10 tables
- **Tables créées** : 1 table (nouvelle version)
- **Réduction** : ~26% de tables en moins

---

## 📚 Documentation

Pour plus de détails, consultez :
- `ANALYSE_TABLES_COMPLETE.md` - Analyse détaillée de chaque table
- `supabase/cleanup_unused_tables.sql` - Script de suppression
- `supabase/create_user_recommendations_table.sql` - Script de création

---

## ⚠️ Notes Importantes

1. **Faites toujours un backup** avant d'exécuter des scripts de suppression
2. **Testez en environnement de développement** avant la production
3. **Vérifiez les dépendances** : certaines tables peuvent être référencées par des vues ou fonctions
4. **La table `message_reads` est conservée** car elle est nécessaire pour les groupes (même si pas encore utilisée dans le code)
5. **Les tables `user_blocks` et `conversation_preferences` sont conservées** car prévues pour des fonctionnalités importantes
