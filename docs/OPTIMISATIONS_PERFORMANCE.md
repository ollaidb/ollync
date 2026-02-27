# Guide d'optimisation des performances – Ollync

Ce document récapitule les problèmes identifiés et les solutions mises en place pour réduire la lenteur, les re-renders inutiles et préparer l'application à plusieurs utilisateurs simultanés.

---

## 1. Messagerie

### Problèmes
- **loadMessages** : charge tous les messages d'une conversation sans pagination → lent pour les longues conversations
- **loadConversations** : `select('*')` sur la vue → surcharge le payload
- **Fallback N+1** : si `get_conversation_summaries` est absent, jusqu'à 2 requêtes par conversation

### Solutions appliquées
- **Pagination des messages** : chargement des 50 derniers d'abord, puis « Charger plus » en scrollant vers le haut
- **Colonnes explicites** : `select('id, content, sender_id, created_at, ...')` au lieu de `*`
- **RPC get_conversation_summaries** : exécuter `supabase/fix_app_stability_and_performance.sql` ou `supabase/optimize_conversation_summaries.sql` pour éviter le N+1

### Structure recommandée des tables
Tables déjà en place : `conversations`, `conversation_participants`, `conversation_user_states`, `messages`, `message_reads`.  
Séparation claire : une conversation = en-tête, les messages = table dédiée. Éviter de mélanger données d'affichage (dates formatées, etc.) en base.

---

## 2. Re-renders et composants

### PostCard
- Déjà `memo(PostCard)` ✓
- **checkLiked** : une requête par carte au montage. Un cache `sessionStorage` limite les appels répétés ✓
- **getPaymentDisplay / truncateTitleToTwoSentences** : mémorisés avec `useMemo` pour éviter les recalculs à chaque render

### MessageBubble
- `memo(MessageBubble)` pour limiter les re-renders dans les listes de messages
- Handlers passés au parent : préférer `useCallback` pour stabilité

### Callbacks
- Tous les handlers passés aux cartes (onLike, onDelete, etc.) doivent être enveloppés dans `useCallback` avec des deps correctes

---

## 3. useEffect – Erreurs classiques

### À éviter
- **Dépendances manquantes** : ne pas désactiver `eslint-disable` sans corriger ; utiliser `useCallback` pour les fonctions
- **Effet qui tourne à chaque render** : tableau de dépendances qui change à chaque render (objets/tableaux créés inline)

### Exemples corrigés
- `PublicProfile.tsx` : `fetchProfile`, `fetchPosts` en `useCallback` au lieu d’ignorer les deps
- `Feed.tsx` : `loadMore` inclut `page` → l’effet se réexécute quand la page change, ce qui est acceptable (pas de boucle infinie)

---

## 4. Listes et virtualisation

### Problème
- `.map()` sur de grands tableaux : Feed, Messages, UsersPage, Notifications, etc. → tous les éléments sont rendus

### Solution recommandée
- **react-virtuoso** ou **react-window** pour les listes longues (Feed, UsersPage, Notifications, liste des conversations, liste des messages)
- Exemple Feed :
  ```tsx
  import { Virtuoso } from 'react-virtuoso'
  <Virtuoso
    data={posts}
    itemContent={(index, post) => <PostCard key={post.id} post={post} viewMode={viewMode} />}
  />
  ```

---

## 5. Requêtes Supabase

### select('*') à remplacer
- Messages : colonnes explicites (voir `loadMessages`)
- Favorites, Annonces, PublicProfile, PostDetails, etc. : sélectionner uniquement les colonnes utilisées

### Pagination
- Toutes les listes : `limit()` + `range()` ou offset
- Ne pas charger tout en une seule requête

### Index SQL (voir `supabase/optimize_messaging_performance.sql`)
- `messages(conversation_id, created_at DESC)` ✓
- `conversations(user1_id, last_message_at DESC)` ✓
- `conversations(user2_id, last_message_at DESC)` ✓
- Pour les filtres : index sur les colonnes utilisées dans `WHERE` (ex. UsersPage : profiles)

---

## 6. Images

### Déjà en place
- Compression avant upload (`imageCompression.ts`)
- `loading="lazy"` et `decoding="async"` sur PostCard ✓

### À améliorer
- Ajouter `loading="lazy"` sur toutes les images non above-the-fold
- CDN / transformation d’images Supabase pour redimensionnement côté serveur
- Placeholder flou pendant le chargement

---

## 7. Données non persistantes

Ne pas stocker en base :
- Dates formatées pour l’affichage (calculer côté client)
- Informations purement UI (état d’ouverture, scroll, etc.)
- Valeurs dérivées calculables (ex. âge à partir de la date de naissance)

---

## 8. Requêtes parallèles

Éviter :
- Lancer de nombreuses requêtes en parallèle au montage (ex. N+1 dans loadConversations)
- Charger conversations + match_requests + appointments + profiles en même temps sans contrôle

Privilégier :
- Séquencer ou regrouper (RPC `get_conversation_summaries`)
- Chargement progressif : afficher d’abord les conversations, puis les métadonnées secondaires

---

## 9. Vérification des temps de requête

Si une requête dépasse ~1 seconde :
1. Vérifier les index sur les colonnes utilisées dans `WHERE` et `ORDER BY`
2. Réduire les colonnes sélectionnées
3. Ajouter pagination / limites
4. Utiliser `EXPLAIN ANALYZE` dans Supabase pour analyser le plan d’exécution

---

## 10. Fichiers modifiés / à exécuter

| Fichier | Action |
|---------|--------|
| `supabase/optimize_messaging_performance.sql` | Exécuter dans le SQL Editor Supabase |
| `supabase/fix_app_stability_and_performance.sql` | S’assurer que get_conversation_summaries est déployé |
| `src/pages/Messages.tsx` | Pagination + select explicite |
| `src/components/Messages/MessageBubble.tsx` | React.memo |
| `src/components/PostCard.tsx` | useMemo pour calculs |
