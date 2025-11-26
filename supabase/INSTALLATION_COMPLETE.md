# Guide d'Installation Complète - Ollync

## Problèmes courants et solutions

### Erreur : "column category_id does not exist"
Cette erreur signifie que la table `posts` existe mais sans certaines colonnes.

**Solution :** Exécutez `supabase/fix_posts_columns.sql` pour ajouter toutes les colonnes manquantes.

### Erreur : "column post_id does not exist" (dans messages)
Cette erreur signifie que la table `messages` existe mais sans la colonne `post_id`.

**Solution :** Exécutez `supabase/add_post_id_to_messages.sql` pour ajouter la colonne.

## Ordre d'installation recommandé

### Étape 1 : Vérifier l'état actuel
```sql
-- Exécutez verify_tables.sql pour voir ce qui existe
```

### Étape 2 : Créer les tables de base (si nécessaire)
```sql
-- Exécutez schema.sql pour créer toutes les tables de base
-- Ce script crée : categories, profiles, posts, likes, comments, etc.
```

### Étape 3 : Corriger les colonnes manquantes
```sql
-- Si posts existe mais sans toutes les colonnes :
fix_posts_columns.sql

-- Si messages existe mais sans post_id :
add_post_id_to_messages.sql

-- Si messages existe mais sans autres colonnes :
fix_messages_columns.sql
```

### Étape 4 : Créer le système de messagerie
```sql
-- Exécutez create_messaging_tables.sql
-- Ce script ajoute les fonctionnalités de groupes, types de messages, etc.
```

### Étape 5 : Créer les likes (si nécessaire)
```sql
-- Exécutez create_likes_table.sql
```

### Étape 6 : Activer les notifications
```sql
-- Exécutez notifications_triggers.sql
-- Ce script crée les triggers pour les notifications automatiques
```

## Scripts de diagnostic

- `verify_tables.sql` - Vérifie quelles tables et colonnes existent
- `check_messages_columns.sql` - Vérifie spécifiquement les colonnes de messages

## Scripts de correction

- `fix_posts_columns.sql` - Ajoute toutes les colonnes manquantes à posts
- `add_post_id_to_messages.sql` - Ajoute post_id à messages
- `fix_messages_columns.sql` - Ajoute toutes les colonnes manquantes à messages

## Scripts principaux

- `schema.sql` - Crée toutes les tables de base
- `create_messaging_tables.sql` - Système de messagerie complet
- `create_likes_table.sql` - Table des likes
- `notifications_triggers.sql` - Triggers de notifications

## Notes importantes

1. **Toujours vérifier d'abord** avec `verify_tables.sql` avant d'exécuter les scripts
2. **Exécutez les scripts de correction** si vous avez des erreurs de colonnes manquantes
3. **L'ordre est important** : créez d'abord les tables de base, puis ajoutez les fonctionnalités
4. **Les scripts utilisent `IF NOT EXISTS`** donc vous pouvez les réexécuter sans problème

## Solution rapide pour les erreurs courantes

### Si vous avez "column category_id does not exist" :
```sql
-- Exécutez simplement :
fix_posts_columns.sql
```

### Si vous avez "column post_id does not exist" (dans messages) :
```sql
-- Exécutez simplement :
add_post_id_to_messages.sql
```

### Si vous avez les deux erreurs :
```sql
-- Exécutez dans l'ordre :
1. fix_posts_columns.sql
2. add_post_id_to_messages.sql
3. fix_messages_columns.sql
```

