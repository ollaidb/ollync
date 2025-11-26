# Système de Notifications - Ollync

## Vue d'ensemble

Le système de notifications permet aux utilisateurs de recevoir des alertes automatiques pour :
- **Likes** : Quand quelqu'un like leur annonce
- **Commentaires** : Quand quelqu'un commente leur annonce
- **Messages** : Quand quelqu'un leur envoie un message
- **Nouvelles annonces** : Quand une nouvelle annonce est publiée dans une catégorie qui les intéresse

## Installation

### 1. Créer les tables

Assurez-vous d'avoir exécuté le fichier `supabase/schema.sql` pour créer toutes les tables nécessaires, y compris la table `notifications`.

### 2. Installer les triggers

Exécutez le fichier `supabase/notifications_triggers.sql` dans votre SQL Editor Supabase :

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase/notifications_triggers.sql`
5. Exécutez le script SQL

## Structure de la table notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'message', 'new_post'
  title VARCHAR(255) NOT NULL,
  content TEXT,
  related_id UUID, -- ID de l'entité liée (post, message, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Types de notifications

### 1. Like (`type: 'like'`)
- **Déclencheur** : Quand un utilisateur like une annonce
- **Destinataire** : Le propriétaire de l'annonce
- **Titre** : "{Nom de l'utilisateur} a aimé votre annonce"
- **Contenu** : Titre de l'annonce
- **related_id** : ID de l'annonce

### 2. Commentaire (`type: 'comment'`)
- **Déclencheur** : Quand un utilisateur commente une annonce
- **Destinataire** : Le propriétaire de l'annonce
- **Titre** : "{Nom de l'utilisateur} a commenté votre annonce"
- **Contenu** : Prévisualisation du commentaire (100 premiers caractères)
- **related_id** : ID de l'annonce

### 3. Message (`type: 'message'`)
- **Déclencheur** : Quand un utilisateur envoie un message
- **Destinataire** : L'autre participant de la conversation
- **Titre** : "{Nom de l'utilisateur} vous a envoyé un message"
- **Contenu** : Prévisualisation du message (100 premiers caractères)
- **related_id** : ID de l'annonce liée ou ID de la conversation

### 4. Nouvelle annonce (`type: 'new_post'`)
- **Déclencheur** : Quand une nouvelle annonce est créée
- **Destinataire** : Utilisateurs qui ont liké au moins 2 annonces dans la même catégorie
- **Titre** : "Nouvelle annonce dans {Nom de la catégorie}"
- **Contenu** : Titre de la nouvelle annonce
- **related_id** : ID de la nouvelle annonce

## Fonctionnalités

### Page de notifications

La page `/notifications` permet de :
- Voir toutes les notifications
- Marquer une notification comme lue
- Marquer toutes les notifications comme lues
- Cliquer sur une notification pour naviguer vers l'élément lié
- Recevoir des notifications en temps réel via Supabase Realtime

### Notifications en temps réel

Les notifications sont mises à jour en temps réel grâce à Supabase Realtime. Quand une nouvelle notification est créée, elle apparaît automatiquement dans la liste sans rechargement de la page.

## Personnalisation

### Modifier les critères pour les nouvelles annonces

Pour modifier les critères de notification pour les nouvelles annonces, éditez la fonction `notify_new_post_interested_users()` dans `supabase/notifications_triggers.sql` :

```sql
-- Exemple : Notifier seulement les utilisateurs avec au moins 5 likes dans la catégorie
HAVING COUNT(*) >= 5

-- Exemple : Limiter à 20 utilisateurs au lieu de 50
LIMIT 20
```

### Désactiver un type de notification

Pour désactiver un type de notification, supprimez ou commentez le trigger correspondant dans `supabase/notifications_triggers.sql`.

## Notes importantes

- Les notifications ne sont pas créées si l'utilisateur interagit avec son propre contenu (ex: like sa propre annonce)
- Les fonctions utilisent `SECURITY DEFINER` pour contourner RLS et permettre l'insertion de notifications
- Les notifications sont limitées à 50 pour les nouvelles annonces pour éviter le spam
- Les utilisateurs doivent avoir liké au moins 2 annonces dans une catégorie pour recevoir des notifications de nouvelles annonces

