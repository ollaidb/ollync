# Protection des données : on ne supprime pas facilement

## Règle

**Annonces publiées, réponses (messages), traces (historique)** ne doivent pas être supprimées en base. On conserve les données et on utilise uniquement du **soft delete** (marquage) pour que l’app affiche « supprimé » ou masque le contenu.

## Ce qui a été mis en place

### 1. Annonces (posts)

- **Aucune politique DELETE** sur la table `posts` : personne (app, admin, RLS) ne peut exécuter un `DELETE` sur les annonces.
- **Suppression uniquement via la RPC** `delete_own_post(p_post_id)` : elle fait un **UPDATE** `status = 'deleted'`. La ligne reste en base, les likes, match_requests, messages gardent leur référence.
- L’app filtre les annonces avec `status = 'deleted'` (elles n’apparaissent plus dans « Mes annonces ») et affiche « Annonce supprimée » partout où une référence existe (messages, favoris, etc.).

### 2. Modération

- **`delete_post_as_admin(target_post_id)`** : ne fait plus de `DELETE`, mais un **UPDATE** `status = 'deleted'`. Les annonces modérées restent en base pour les traces.

### 3. Messages / réponses

- Déjà protégés par le script **`persist_conversations_content.sql`** (pas de CASCADE qui supprime les messages).
- Aucune politique **DELETE** sur la table `messages` : suppression uniquement en soft delete (`is_deleted`, `deleted_for_user_id`, `is_deleted_for_all`).

### 4. Traces (historique)

- **`search_history`** : la politique permettant aux utilisateurs de supprimer leur historique a été retirée. Les recherches restent en base (traces conservées).

## Scripts à exécuter (Supabase SQL Editor)

1. **`supabase/protect_data_no_hard_delete.sql`** (une fois)  
   - Soft delete pour les annonces, plus de DELETE sur `posts`.  
   - Modération en soft delete.  
   - Traces `search_history` et `messages` protégées (pas de DELETE).

2. **`supabase/persist_conversations_content.sql`** (si pas déjà fait)  
   - Conversations et messages non supprimés par CASCADE (post ou profil supprimé).

## Côté application

- **PostDetails** : la suppression d’annonce passe par la RPC `delete_own_post` (soft delete), plus par `supabase.from('posts').delete()`.
- **Annonces** : déjà en place via `delete_own_post`.

## Résumé

| Donnée           | Suppression physique (DELETE) | Comportement voulu                          |
|------------------|-------------------------------|---------------------------------------------|
| Annonces (posts) | Interdite (pas de politique)  | Soft delete : `status = 'deleted'`          |
| Messages         | Interdite                     | Soft delete : `is_deleted`, `deleted_for_*` |
| Conversations    | Évitée (SET NULL)             | Conservées si post/profil supprimé          |
| Historique recherche | Interdite                 | Traces conservées                           |

Ainsi, annonces, réponses et traces ne sont plus supprimées facilement ; seules des mises à jour de statut ou de champs de soft delete sont utilisées.
