# Guide d'Installation - Système de Messagerie

## Problème : "column post_id does not exist"

Cette erreur signifie que la colonne `post_id` n'existe pas dans la table `messages`. Voici comment résoudre le problème étape par étape.

## Étape 1 : Vérifier ce qui existe

Exécutez d'abord le script `supabase/verify_tables.sql` dans votre SQL Editor Supabase pour voir :
- Si la table `posts` existe
- Si la table `messages` existe
- Quelles colonnes existent dans `messages`

**Si la table `posts` n'existe pas**, vous devez d'abord créer toutes les tables de base.

## Étape 2 : Créer les tables de base (si nécessaire)

Si la table `posts` n'existe pas, exécutez d'abord :
1. `supabase/schema.sql` - Crée toutes les tables de base (posts, profiles, categories, etc.)

## Étape 3 : Ajouter la colonne post_id

Une fois que vous avez vérifié que la table `posts` existe, exécutez :
1. `supabase/add_post_id_to_messages.sql` - Ajoute simplement la colonne `post_id` à la table `messages`

## Étape 4 : Créer les autres colonnes de messages

Ensuite, exécutez :
1. `supabase/fix_messages_columns.sql` - Ajoute toutes les autres colonnes nécessaires (message_type, link_url, etc.)

## Étape 5 : Créer le système de messagerie complet

Enfin, exécutez :
1. `supabase/create_messaging_tables.sql` - Crée les tables et fonctionnalités complètes de messagerie

## Ordre d'exécution recommandé

```
1. verify_tables.sql (pour diagnostiquer)
2. schema.sql (si posts n'existe pas)
3. add_post_id_to_messages.sql (ajouter post_id)
4. fix_messages_columns.sql (ajouter autres colonnes)
5. create_messaging_tables.sql (système complet)
6. create_likes_table.sql (si nécessaire)
7. notifications_triggers.sql (notifications automatiques)
```

## Solution rapide

Si vous voulez juste ajouter `post_id` rapidement, exécutez cette commande dans le SQL Editor :

```sql
-- Vérifier que posts existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'posts'
) as posts_exists;

-- Si posts existe, ajouter post_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS post_id UUID;

-- Ajouter la contrainte de clé étrangère
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_post_id_fkey'
  ) THEN
    ALTER TABLE messages 
      ADD CONSTRAINT messages_post_id_fkey 
      FOREIGN KEY (post_id) 
      REFERENCES posts(id) 
      ON DELETE SET NULL;
  END IF;
END $$;
```

## Notes importantes

- La table `posts` DOIT exister avant d'ajouter `post_id` avec une référence
- Si `posts` n'existe pas, créez-la d'abord avec `schema.sql`
- La colonne `post_id` est optionnelle (peut être NULL) car tous les messages ne sont pas liés à une annonce

