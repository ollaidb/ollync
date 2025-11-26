# Installation du Système de Notifications et de Likes

## Étapes d'installation

### Étape 1 : Créer la table `likes`

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase/create_likes_table.sql`
5. Exécutez le script SQL

Cette étape va créer :
- La table `likes` pour permettre aux utilisateurs de liker les annonces
- Les index pour améliorer les performances
- Les policies RLS (Row Level Security) pour la sécurité
- Le trigger pour mettre à jour automatiquement le compteur de likes sur les posts

### Étape 2 : Installer les triggers de notifications

1. Toujours dans le **SQL Editor** de Supabase
2. Copiez le contenu du fichier `supabase/notifications_triggers.sql`
3. Exécutez le script SQL

Cette étape va créer :
- La fonction `create_notification` pour créer des notifications
- Les triggers pour créer automatiquement des notifications lors de :
  - Un like sur une annonce
  - Un commentaire sur une annonce
  - Un message envoyé
  - Une nouvelle annonce publiée

### Étape 3 : Vérifier que tout fonctionne

Après avoir exécuté les deux scripts, vous pouvez vérifier que tout est en place :

```sql
-- Vérifier que la table likes existe
SELECT * FROM likes LIMIT 1;

-- Vérifier que les triggers existent
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%' OR trigger_name LIKE '%like%';
```

## Structure de la table `likes`

La table `likes` permet aux utilisateurs de liker toutes les annonces :

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, post_id)  -- Un utilisateur ne peut liker une annonce qu'une fois
);
```

## Fonctionnalités

### Likes
- ✅ Les utilisateurs peuvent liker toutes les annonces
- ✅ Un utilisateur ne peut liker une annonce qu'une seule fois (contrainte UNIQUE)
- ✅ Le compteur de likes est mis à jour automatiquement sur les posts
- ✅ Une notification est créée automatiquement quand quelqu'un like votre annonce

### Notifications automatiques
- ✅ Notification quand quelqu'un like votre annonce
- ✅ Notification quand quelqu'un commente votre annonce
- ✅ Notification quand quelqu'un vous envoie un message
- ✅ Notification pour les nouvelles annonces dans vos catégories préférées

## Notes importantes

- Si la table `likes` existe déjà, le script utilisera `CREATE TABLE IF NOT EXISTS` et ne supprimera pas les données existantes
- Les triggers de notifications nécessitent que la table `notifications` existe déjà (créée par `schema.sql`)
- Les fonctions utilisent `SECURITY DEFINER` pour contourner RLS et permettre l'insertion de notifications

