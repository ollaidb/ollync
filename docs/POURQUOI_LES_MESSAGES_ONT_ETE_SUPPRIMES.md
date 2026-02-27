# Pourquoi les messages ont pu être supprimés – et comment ne plus jamais revivre ça

## Ce qui s’est très probablement passé

Les messages n’ont pas été supprimés par un bouton « Supprimer les messages » dans l’app. Ils ont été supprimés **automatiquement par la base de données** à cause des contraintes **ON DELETE CASCADE**. Une seule action (suppression d’un profil ou d’un post) a enchaîné des suppressions en cascade.

---

## 1. La chaîne CASCADE (cause la plus probable)

### Schéma avant correctif

```
posts (annonces)
  ↑
  | post_id, ON DELETE CASCADE
  |
conversations (user1_id, user2_id → profiles, CASCADE aussi)
  ↑
  | conversation_id, ON DELETE CASCADE
  |
messages
```

Dès qu’une ligne est **supprimée** (DELETE) dans une table « parent », PostgreSQL supprime **toutes** les lignes liées dans les tables « enfant ».

### Scénario A : suppression d’un **profil** (compte utilisateur)

1. Quelqu’un exécute **DELETE** sur `profiles` (ou appelle la fonction `delete_user_account()`).
2. PostgreSQL supprime **toutes les conversations** où cet utilisateur est `user1_id` ou `user2_id`.
3. Pour **chaque conversation** supprimée, il supprime **tous les messages** de cette conversation.

Conséquence : **toutes les conversations** où cette personne figurait disparaissent, et **tous les messages** de ces conversations sont supprimés, pour **tous les participants** (pas seulement pour l’utilisateur dont le compte a été supprimé).

Exemples concrets :
- Un utilisateur clique sur « Supprimer mon compte » → ses conversations + tous les messages dedans disparaissent pour tout le monde.
- Un admin ou un script fait un `DELETE FROM profiles WHERE ...` (nettoyage, test, erreur) → même effet.

### Scénario B : suppression de **posts** (annonces)

1. Quelqu’un exécute **DELETE** sur `posts` (script de nettoyage, modération, erreur manuelle).
2. PostgreSQL supprime **toutes les conversations** dont `post_id` pointait vers ces annonces.
3. Pour chaque conversation supprimée, il supprime **tous les messages** de cette conversation.

Conséquence : toutes les conversations créées à partir de ces annonces + tous les messages dedans disparaissent.

### Scénario C : script « doublons » (conversations masquées, pas supprimées)

Le script **`ensure_unique_direct_conversations.sql`** ne supprime pas les lignes. Il met `deleted_at = NOW()` sur certaines conversations (doublons). Ces conversations ne s’affichent plus dans l’app (filtrées par `deleted_at IS NULL`). Les messages sont déplacés vers la conversation conservée. Donc ce script ne fait pas « tout supprimer », mais peut donner l’impression que des conversations ont disparu.

---

## 2. Résumé : qu’est-ce qui a pu tout faire disparaître ?

| Action réelle en base | Effet |
|------------------------|--------|
| **DELETE FROM profiles** (un seul utilisateur) | Toutes les conversations où il est user1 ou user2 sont supprimées → **tous les messages** de ces conversations sont supprimés pour **tout le monde**. |
| **DELETE FROM posts** (une ou plusieurs annonces) | Toutes les conversations liées à ces annonces sont supprimées → **tous les messages** de ces conversations sont supprimés. |
| Appel à **`delete_user_account()`** | = DELETE du profil → même chaîne que la ligne ci-dessus. |
| Script **ensure_unique_direct_conversations** | Conversations marquées `deleted_at` (masquées), messages fusionnés dans une conversation conservée. Pas de suppression physique des messages. |

Donc l’« horreur » (tout disparaît) vient très probablement de :
- une **suppression de profil** (compte utilisateur ou admin/script), ou  
- une **suppression de posts** (annonces),  

avec les anciennes contraintes **ON DELETE CASCADE** qui ont propagé la suppression aux conversations puis aux messages.

---

## 3. Ce qui a été mis en place pour que ça ne se reproduise pas

Le script **`supabase/persist_conversations_content.sql`** remplace les CASCADE par **ON DELETE SET NULL** pour les liens concernant les conversations et les messages :

- **conversations.post_id** → SET NULL (si un post est supprimé, la conversation reste, sans annonce liée).
- **conversations.user1_id / user2_id** → SET NULL (si un utilisateur supprime son compte, la conversation reste pour l’autre, avec « Compte supprimé »).
- **messages.sender_id** → SET NULL (les messages restent même si l’expéditeur supprime son compte).
- **appointments** (message_id, conversation_id, sender_id, recipient_id) → SET NULL (les rendez-vous ne sont plus supprimés en cascade).

Après exécution de ce script :
- Supprimer un **post** ou un **profil** ne supprime plus les conversations ni les messages ; les références deviennent NULL, le contenu reste.

---

## 4. Bonnes pratiques pour ne plus jamais supprimer des données par erreur

1. **Exécuter le script de persistance**  
   Une fois dans le SQL Editor Supabase : **`persist_conversations_content.sql`**.

2. **Ne jamais faire de DELETE direct sur `posts` ou `profiles`** pour un « retrait » ou une « désactivation ».  
   Utiliser du **soft delete** (ex. `status = 'deleted'`, `deleted_at = NOW()`) et filtrer dans l’app.

3. **Suppression de compte**  
   Si vous gardez une action « Supprimer mon compte », soit :
   - vous avez exécuté le script de persistance (les conversations/messages restent pour les autres),  
   - soit vous décidez explicitement de supprimer les données de l’utilisateur (DELETE du profil) en sachant que, **avant** le script, ça faisait disparaître toutes les conversations et messages partagés avec cet utilisateur.

4. **Scripts et migrations**  
   Avant tout script qui fait un **DELETE** ou **DROP** sur des tables métier (posts, profiles, conversations, messages), vérifier les contraintes (CASCADE vs SET NULL) et tester sur une copie de la base.

5. **Sauvegardes**  
   Configurer des sauvegardes automatiques Supabase (point-in-time recovery) pour pouvoir revenir en arrière en cas d’erreur.

6. **Ne pas réexécuter sans comprendre**  
   Ne pas lancer des scripts SQL (surtout `ensure_unique_*`, ou des scripts de « nettoyage ») en prod sans avoir lu ce qu’ils font (DELETE, UPDATE deleted_at, etc.).

---

## 5. En une phrase

**La cause la plus probable de la disparition de tous les messages est une suppression en base (DELETE) d’un ou plusieurs profils ou posts, qui a déclenché la suppression en cascade des conversations puis de tous les messages. Le script `persist_conversations_content.sql` empêche cette propagation en remplaçant CASCADE par SET NULL pour les conversations et le contenu lié.**
