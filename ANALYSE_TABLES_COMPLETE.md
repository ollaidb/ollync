# Analyse Complète des Tables de la Base de Données Ollync

## 📊 Résumé Exécutif

Cet document analyse toutes les tables existantes dans la base de données, leur utilisation dans le code, et identifie les tables à conserver, supprimer ou consolider.

---

## ✅ TABLES ESSENTIELLES (À CONSERVER)

### 1. **categories** ✅ UTILISÉE
- **Usage** : Catégories principales (Match, Recrutement, Projet, Service, Vente, Mission, Autre)
- **Fréquence** : Très utilisée dans tout le code
- **Action** : **CONSERVER**

### 2. **profiles** ✅ UTILISÉE
- **Usage** : Profils utilisateurs (étend auth.users)
- **Fréquence** : Table la plus utilisée dans le code
- **Action** : **CONSERVER**

### 3. **sub_categories** ✅ UTILISÉE
- **Usage** : Sous-catégories pour chaque catégorie principale
- **Fréquence** : Utilisée dans plusieurs fichiers
- **Action** : **CONSERVER**

### 4. **posts** ✅ UTILISÉE
- **Usage** : Annonces/publications
- **Fréquence** : Table centrale, très utilisée
- **Action** : **CONSERVER**

### 5. **likes** ✅ UTILISÉE
- **Usage** : Likes sur les annonces
- **Fréquence** : Utilisée dans PostCard, PostDetails, Favorites, Home
- **Action** : **CONSERVER**

### 6. **favorites** ✅ UTILISÉE
- **Usage** : Favoris des utilisateurs (page Favoris)
- **Fréquence** : Utilisée dans Favorites.tsx, Home.tsx
- **Action** : **CONSERVER**

### 7. **comments** ⚠️ PARTIELLEMENT UTILISÉE
- **Usage** : Commentaires/réponses aux annonces
- **Fréquence** : Définie dans schema mais utilisation limitée dans le code
- **Action** : **CONSERVER** (fonctionnalité prévue)

### 8. **shares** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Partages d'annonces
- **Fréquence** : Définie dans schema mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (si fonctionnalité non implémentée)

### 9. **applications** ✅ UTILISÉE
- **Usage** : Candidatures pour les annonces (accepter/refuser)
- **Fréquence** : Utilisée dans PostDetails.tsx
- **Action** : **CONSERVER**

### 10. **follows** ✅ UTILISÉE
- **Usage** : Abonnements entre utilisateurs
- **Fréquence** : Utilisée dans PublicProfile.tsx, Favorites.tsx
- **Action** : **CONSERVER**

### 11. **conversations** ✅ UTILISÉE
- **Usage** : Conversations entre utilisateurs
- **Fréquence** : Utilisée dans Messages.tsx
- **Action** : **CONSERVER**

### 12. **conversation_participants** ✅ UTILISÉE
- **Usage** : Participants aux conversations de groupe
- **Fréquence** : Utilisée dans Messages.tsx, CreateGroupModal.tsx
- **Action** : **CONSERVER**

### 13. **messages** ✅ UTILISÉE
- **Usage** : Messages dans les conversations
- **Fréquence** : Utilisée dans Messages.tsx
- **Action** : **CONSERVER**

### 14. **notifications** ✅ UTILISÉE
- **Usage** : Notifications des utilisateurs
- **Fréquence** : Table centrale pour les notifications
- **Action** : **CONSERVER**

### 15. **matches** ✅ UTILISÉE
- **Usage** : Matches entre utilisateurs
- **Fréquence** : Utilisée dans create_matches_table.sql (système de swipe)
- **Action** : **CONSERVER**

### 16. **match_requests** ✅ UTILISÉE
- **Usage** : Demandes de match (envoyées et reçues)
- **Fréquence** : Utilisée dans PostDetails.tsx, Messages.tsx, SwipePage.tsx
- **Action** : **CONSERVER**

### 17. **interests** ✅ UTILISÉE
- **Usage** : Swipe à droite (intérêts exprimés sur les posts)
- **Fréquence** : Utilisée dans Home.tsx, SwipePage.tsx
- **Action** : **CONSERVER**

### 18. **ignored_posts** ✅ UTILISÉE
- **Usage** : Posts ignorés (swipe à gauche)
- **Fréquence** : Utilisée dans SwipePage.tsx
- **Action** : **CONSERVER**

### 19. **user_interests** ✅ UTILISÉE
- **Usage** : Centres d'intérêt des utilisateurs (catégories sélectionnées)
- **Fréquence** : Utilisée dans UsersPage.tsx
- **Action** : **CONSERVER**

### 20. **saved_searches** ✅ UTILISÉE
- **Usage** : Recherches sauvegardées par les utilisateurs
- **Fréquence** : Utilisée dans Home.tsx (avec gestion d'erreur si table n'existe pas)
- **Action** : **CONSERVER**

### 21. **reports** ✅ UTILISÉE
- **Usage** : Signalements (posts, utilisateurs, commentaires)
- **Fréquence** : Utilisée dans PublicProfile.tsx
- **Action** : **CONSERVER**

### 22. **ratings** ✅ UTILISÉE
- **Usage** : Avis/ratings entre utilisateurs
- **Fréquence** : Utilisée dans PublicProfile.tsx
- **Action** : **CONSERVER**

### 23. **message_likes** ✅ UTILISÉE
- **Usage** : Likes sur les messages
- **Fréquence** : Utilisée dans Messages.tsx
- **Action** : **CONSERVER**

### 24. **message_reports** ✅ UTILISÉE
- **Usage** : Signalements de messages
- **Fréquence** : Utilisée dans Messages.tsx
- **Action** : **CONSERVER**

---

## ❌ TABLES NON UTILISÉES (À SUPPRIMER)

### 25. **recommendation_rules** ❌ NON UTILISÉE
- **Usage** : Règles et pondérations pour l'algorithme de recommandation
- **Fréquence** : Créée mais jamais utilisée dans le code
- **Action** : **SUPPRIMER** (consolidation en une seule table de recommandation)

### 26. **user_recommendations** ❌ NON UTILISÉE
- **Usage** : Cache des scores de recommandation calculés
- **Fréquence** : Créée mais jamais utilisée dans le code
- **Action** : **SUPPRIMER** (consolidation en une seule table de recommandation)

### 27. **recommendation_history** ❌ NON UTILISÉE
- **Usage** : Historique des recommandations affichées
- **Fréquence** : Créée mais jamais utilisée dans le code
- **Action** : **SUPPRIMER** (consolidation en une seule table de recommandation)

### 28. **user_algorithm_preferences** ❌ NON UTILISÉE
- **Usage** : Préférences personnalisées de l'utilisateur pour les recommandations
- **Fréquence** : Créée mais jamais utilisée dans le code
- **Action** : **SUPPRIMER** (consolidation en une seule table de recommandation)

### 29. **search_history** ❌ NON UTILISÉE
- **Usage** : Historique de toutes les recherches effectuées
- **Fréquence** : Créée mais jamais utilisée dans le code
- **Action** : **SUPPRIMER** (peut être ajoutée plus tard si besoin)

### 30. **shares** ❌ NON UTILISÉE
- **Usage** : Partages d'annonces
- **Fréquence** : Définie dans schema mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (si fonctionnalité non implémentée)

---

## ⚠️ TABLES OPTIONNELLES (À VÉRIFIER)

### 31. **user_settings** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Paramètres utilisateur (notifications, langue, thème)
- **Fréquence** : Définie dans ALL_TABLES.sql mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (si fonctionnalité non implémentée)

### 32. **post_views** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Vues détaillées des posts
- **Fréquence** : Définie dans ALL_TABLES.sql mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (les vues sont trackées dans posts.views_count)

### 33. **tags** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Tags pour les posts
- **Fréquence** : Définie dans ALL_TABLES.sql mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (si fonctionnalité non implémentée)

### 34. **post_tags** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Liaison posts-tags
- **Fréquence** : Définie dans ALL_TABLES.sql mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (si fonctionnalité non implémentée)

### 35. **transactions** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Transactions financières
- **Fréquence** : Définie dans ALL_TABLES.sql mais pas utilisée dans le code
- **Action** : **SUPPRIMER** (si fonctionnalité non implémentée)

### 36. **user_blocks** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Blocages d'utilisateurs
- **Fréquence** : Créée dans extend_messaging_features.sql mais pas utilisée dans le code
- **Action** : **CONSERVER** (fonctionnalité importante pour la sécurité)

### 37. **conversation_preferences** ⚠️ NON UTILISÉE DANS LE CODE
- **Usage** : Préférences de conversation (notifications, archivage, mute)
- **Fréquence** : Créée dans extend_messaging_features.sql mais pas utilisée dans le code
- **Action** : **CONSERVER** (fonctionnalité prévue pour améliorer l'UX)

### 38. **message_reads** ✅ À CONSERVER
- **Usage** : Lecture des messages dans les groupes (plusieurs utilisateurs peuvent lire le même message)
- **Fréquence** : Créée dans setup_messaging_complete.sql (prévue pour les groupes)
- **Note** : `messages.read_at` est utilisé pour les conversations individuelles, `message_reads` est nécessaire pour les groupes
- **Action** : **CONSERVER** (fonctionnalité prévue pour les groupes)

---

## 🔄 CONSOLIDATION DES TABLES DE RECOMMANDATION

### Problème Actuel
Il existe **4 tables différentes** pour les recommandations :
1. `recommendation_rules` - Règles de l'algorithme
2. `user_recommendations` - Scores calculés (cache)
3. `recommendation_history` - Historique des recommandations
4. `user_algorithm_preferences` - Préférences utilisateur

**Aucune de ces tables n'est utilisée dans le code actuel.**

### Solution Proposée
Créer **UNE SEULE TABLE** pour gérer les recommandations :
- `user_recommendations` (nouvelle version simplifiée)
  - `user_id` : Utilisateur
  - `post_id` : Post recommandé
  - `score` : Score de recommandation (0-100)
  - `reason` : Raison de la recommandation (ex: "Basé sur vos likes", "Proche géographiquement")
  - `created_at` : Date de création
  - `updated_at` : Date de mise à jour

Cette table simple permet de :
- Stocker les recommandations calculées
- Tracer l'historique (en gardant les anciennes entrées)
- Faciliter les requêtes de récupération

---

## 📋 RÉSUMÉ DES ACTIONS

### Tables à CONSERVER (27 tables)
1. categories
2. profiles
3. sub_categories
4. posts
5. likes
6. favorites
7. comments
8. applications
9. follows
10. conversations
11. conversation_participants
12. messages
13. notifications
14. matches
15. match_requests
16. interests
17. ignored_posts
18. user_interests
19. saved_searches
20. reports
21. ratings
22. message_likes
23. message_reports
24. user_blocks (à implémenter)
25. conversation_preferences (à implémenter)
26. message_reads (pour les groupes)
27. user_recommendations (nouvelle version simplifiée - à créer)

### Tables à SUPPRIMER (10 tables)
1. recommendation_rules
2. user_recommendations (ancienne version)
3. recommendation_history
4. user_algorithm_preferences
5. search_history
6. shares
7. user_settings
8. post_views
9. tags
10. post_tags
11. transactions
12. message_reads (si redondant avec messages.read_at)

### Tables à CRÉER
1. `user_recommendations` (nouvelle version simplifiée)

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Analyser toutes les tables (FAIT)
2. ⏳ Créer un script SQL pour supprimer les tables non utilisées
3. ⏳ Créer la nouvelle table de recommandation simplifiée
4. ⏳ Mettre à jour la documentation
5. ⏳ Tester les scripts avant exécution en production
