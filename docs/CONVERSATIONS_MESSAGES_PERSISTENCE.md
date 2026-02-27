# Conversations et messages : persistance et suppression

## Règle métier

**Tout ce qui est envoyé dans une conversation reste** (messages, photos, annonces partagées, rendez-vous, liens, etc.) **jusqu’à ce que l’utilisateur choisisse explicitement de supprimer ses données** dans l’application.  
La suppression automatique par la base (CASCADE) ne doit pas faire disparaître ce contenu.

---

## Script à exécuter une fois (Supabase SQL Editor)

Un seul script applique toutes les protections nécessaires :

**`supabase/persist_conversations_content.sql`**

Il fait notamment :

1. **Conversations**
   - `post_id` → `ON DELETE SET NULL` : si une annonce est supprimée, la conversation reste (sans annonce liée).
   - `user1_id` et `user2_id` → `ON DELETE SET NULL` et colonnes nullables : si un utilisateur supprime son compte, la conversation reste pour l’autre (avec “Compte supprimé” côté affichage).

2. **Messages**
   - `sender_id` → `ON DELETE SET NULL` et colonne nullable : les messages restent même si l’expéditeur supprime son compte (affichage “Compte supprimé” ou “Utilisateur supprimé”).

3. **Rendez-vous (appointments)**
   - `message_id`, `conversation_id`, `sender_id`, `recipient_id` → `ON DELETE SET NULL` et colonnes nullables : les rendez-vous ne sont plus supprimés quand un message, une conversation ou un utilisateur est supprimé.

4. **Contenu conservé**
   - Messages (texte, liens).
   - Photos / pièces jointes (URL stockée dans le message).
   - Annonces partagées (`shared_post_id` déjà en `SET NULL` ailleurs).
   - Rendez-vous créés dans la conversation.
   - États par utilisateur (archive, épingle, “supprimé pour moi”) via `conversation_user_states` (non modifié par ce script).

---

## Affichage côté app (recommandé)

Après exécution du script, certaines clés peuvent être `null` :

- **Conversation** : `user1_id` ou `user2_id` peut être `null` (compte supprimé).  
  → Afficher “Compte supprimé” ou “Utilisateur supprimé” pour l’interlocuteur quand `otherUserId` est `null` ou quand le profil n’existe pas.

- **Message** : `sender_id` peut être `null`.  
  → Afficher “Compte supprimé” ou “Utilisateur supprimé” à la place du nom d’expéditeur quand `sender` est `null`.

- **Rendez-vous** : `sender_id` ou `recipient_id` peut être `null`.  
  → Afficher “Compte supprimé” pour la partie dont l’id est `null` si vous affichez les noms.

---

## Autres scripts (optionnels)

- **`fix_conversations_never_deleted_by_post.sql`**  
  Ne fait que `conversations.post_id` → `ON DELETE SET NULL`. Redondant si vous avez déjà exécuté `persist_conversations_content.sql`.

- **`restore_conversations_deleted_at.sql`**  
  Remet `deleted_at = NULL` sur des conversations marquées “supprimées” par le script de fusion des doublons (`ensure_unique_direct_conversations.sql`), pour les réafficher.

---

## Résumé

| Action | Effet |
|--------|--------|
| Exécuter **`persist_conversations_content.sql`** une fois | Tout le contenu des conversations (messages, photos, annonces partagées, rendez-vous, liens) reste en base ; seules les suppressions explicites par l’utilisateur suppriment des données. |
| Adapter l’UI pour `sender_id` / `user1_id` / `user2_id` null | Afficher “Compte supprimé” ou équivalent pour une expérience cohérente. |

