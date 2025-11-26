# Système de Messagerie - Ollync

## Vue d'ensemble

Le système de messagerie permet aux utilisateurs de communiquer entre eux avec les fonctionnalités suivantes :
- **Conversations individuelles** : communication entre deux utilisateurs
- **Groupes de messages** : jusqu'à 10 participants par groupe
- **Types de messages** : texte, annonce, lien
- **Réponses aux messages** : système de threading pour répondre à un message spécifique
- **Notifications** : notifications automatiques lors de la réception de messages

## Installation

### Étape 1 : Créer les tables de messagerie

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase/create_messaging_tables.sql`
5. Exécutez le script SQL

### Étape 2 : Installer les triggers de notifications

Si vous ne l'avez pas déjà fait, exécutez également `supabase/notifications_triggers.sql` pour activer les notifications automatiques.

## Structure des tables

### 1. `conversations`
Gère les conversations individuelles et les groupes.

**Champs principaux :**
- `id` : Identifiant unique
- `user1_id`, `user2_id` : Pour les conversations individuelles
- `is_group` : Indique si c'est un groupe
- `group_name` : Nom du groupe (optionnel)
- `group_creator_id` : Créateur du groupe
- `post_id` : Annonce liée (optionnel)
- `last_message_at` : Date du dernier message

**Contraintes :**
- Une conversation est soit individuelle (user1_id + user2_id), soit un groupe (is_group = true)

### 2. `conversation_participants`
Liste des participants aux groupes (et le créateur est ajouté automatiquement).

**Champs principaux :**
- `conversation_id` : ID de la conversation
- `user_id` : ID du participant
- `joined_at` : Date d'ajout au groupe
- `left_at` : Date de sortie du groupe (optionnel)
- `is_active` : Si le participant est toujours actif

**Contraintes :**
- Maximum 10 participants actifs par groupe
- Un utilisateur ne peut être qu'une fois dans une conversation

### 3. `messages`
Stocke tous les messages envoyés.

**Champs principaux :**
- `id` : Identifiant unique
- `conversation_id` : Conversation dans laquelle le message est envoyé
- `sender_id` : Expéditeur du message
- `message_type` : Type de message ('text', 'post', 'link')
- `content` : Contenu texte du message
- `post_id` : Pour les messages de type 'post' (référence à une annonce)
- `link_url`, `link_title`, `link_description`, `link_image_url` : Pour les messages de type 'link'
- `reply_to_message_id` : ID du message auquel on répond (optionnel)
- `read_at` : Date de lecture (pour conversations individuelles)
- `edited_at` : Date de modification (optionnel)
- `deleted_at` : Date de suppression (optionnel)

**Types de messages :**
- **'text'** : Message texte simple (requiert `content`)
- **'post'** : Partage d'une annonce (requiert `post_id`)
- **'link'** : Partage d'un lien (requiert `link_url`)

### 4. `message_reads`
Suit les lectures de messages dans les groupes.

**Champs principaux :**
- `message_id` : ID du message
- `user_id` : ID de l'utilisateur qui a lu
- `read_at` : Date de lecture

## Fonctionnalités

### Créer une conversation individuelle

```sql
INSERT INTO conversations (user1_id, user2_id, post_id)
VALUES ('user1-uuid', 'user2-uuid', 'post-uuid-optional');
```

### Créer un groupe (jusqu'à 10 personnes)

```sql
-- Créer le groupe
INSERT INTO conversations (is_group, group_name, group_creator_id)
VALUES (true, 'Mon groupe', 'creator-uuid');

-- Ajouter des participants (le créateur est ajouté automatiquement)
INSERT INTO conversation_participants (conversation_id, user_id)
VALUES ('conversation-uuid', 'user-uuid');
```

### Envoyer un message texte

```sql
INSERT INTO messages (conversation_id, sender_id, message_type, content)
VALUES ('conversation-uuid', 'sender-uuid', 'text', 'Bonjour !');
```

### Envoyer une annonce

```sql
INSERT INTO messages (conversation_id, sender_id, message_type, post_id, content)
VALUES ('conversation-uuid', 'sender-uuid', 'post', 'post-uuid', 'Regardez cette annonce !');
```

### Envoyer un lien

```sql
INSERT INTO messages (
  conversation_id, 
  sender_id, 
  message_type, 
  link_url, 
  link_title, 
  link_description,
  content
)
VALUES (
  'conversation-uuid', 
  'sender-uuid', 
  'link', 
  'https://example.com',
  'Titre du lien',
  'Description du lien',
  'Voici un lien intéressant !'
);
```

### Répondre à un message

```sql
INSERT INTO messages (
  conversation_id, 
  sender_id, 
  message_type, 
  content, 
  reply_to_message_id
)
VALUES (
  'conversation-uuid', 
  'sender-uuid', 
  'text', 
  'Ma réponse',
  'message-uuid-to-reply-to'
);
```

### Marquer un message comme lu (pour les groupes)

```sql
INSERT INTO message_reads (message_id, user_id)
VALUES ('message-uuid', 'user-uuid')
ON CONFLICT (message_id, user_id) DO NOTHING;
```

## Triggers automatiques

### 1. Mise à jour de `last_message_at`
Quand un nouveau message est créé, `last_message_at` de la conversation est automatiquement mis à jour.

### 2. Ajout du créateur comme participant
Quand un groupe est créé, le créateur est automatiquement ajouté comme participant actif.

### 3. Vérification de la limite de 10 participants
Le système empêche l'ajout de plus de 10 participants actifs dans un groupe.

### 4. Notifications automatiques
Les notifications sont créées automatiquement quand :
- Un message est envoyé dans une conversation individuelle
- Un message est envoyé dans un groupe (tous les participants sont notifiés sauf l'expéditeur)

## Sécurité (RLS)

Toutes les tables ont Row Level Security (RLS) activé avec des politiques qui permettent :
- Les utilisateurs ne peuvent voir que leurs propres conversations
- Les utilisateurs ne peuvent envoyer des messages que dans leurs conversations
- Les utilisateurs ne peuvent modifier que leurs propres messages
- Les utilisateurs ne peuvent voir que les participants de leurs conversations

## Notes importantes

- Un groupe ne peut pas avoir plus de 10 participants actifs
- Les messages supprimés sont marqués avec `deleted_at` (soft delete)
- Les messages modifiés sont marqués avec `edited_at`
- Les notifications sont créées automatiquement pour tous les participants d'un groupe (sauf l'expéditeur)
- Le créateur d'un groupe est automatiquement ajouté comme participant

