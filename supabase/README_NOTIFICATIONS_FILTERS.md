# Guide d'Installation - Filtres de Notifications

## Vue d'ensemble

Ce guide explique comment installer et optimiser le système de filtres de notifications dans la base de données Supabase.

## Scripts SQL disponibles

### 1. `update_notifications_system.sql` (Script principal)
Ce script contient toute la logique de base pour le système de notifications :
- Structure de la table `notifications` avec colonnes supplémentaires (`sender_id`, `group_key`, `metadata`)
- Fonctions de création/mise à jour de notifications
- Triggers pour tous les types de notifications
- Support du regroupement des notifications

**⚠️ Important :** Exécutez ce script en premier si vous n'avez pas encore mis à jour votre système de notifications.

### 2. `optimize_notifications_filters.sql` (Script d'optimisation)
Ce script optimise la base de données spécifiquement pour les filtres de notifications :
- Index composites pour améliorer les performances de filtrage
- Index partiels pour les filtres "Match" et "Actualité"
- Fonction utilitaire pour obtenir les statistiques de filtres

**⚠️ Important :** Exécutez ce script après `update_notifications_system.sql` pour optimiser les performances.

## Installation

### Étape 1 : Exécuter le script principal

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `supabase/update_notifications_system.sql`
5. Copiez tout le contenu
6. Collez-le dans l'éditeur SQL
7. Cliquez sur **Run** pour exécuter le script

### Étape 2 : Exécuter le script d'optimisation

1. Dans le même **SQL Editor**
2. Ouvrez le fichier `supabase/optimize_notifications_filters.sql`
3. Copiez tout le contenu
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** pour exécuter le script

## Types de notifications supportés

Le système supporte les types suivants, organisés par filtres :

### Filtre "Tout"
Affiche toutes les notifications sans filtre.

### Filtre "Like"
- `like` : Quand quelqu'un like une annonce

### Filtre "Commentaire"
- `comment` : Quand quelqu'un commente une annonce

### Filtre "Match"
- `match_request_accepted` : Quand une demande de match est acceptée
- `match_request_received` : Quand vous recevez une demande de match
- `match_request_sent` : Quand vous envoyez une demande de match

### Filtre "Actualité"
- `new_post` : Nouvelle annonce dans une catégorie qui vous intéresse
- `post_updated` : Une annonce que vous suivez a été mise à jour
- `post_closed` : Une annonce à laquelle vous avez répondu est clôturée

### Autres types (non filtrés dans le menu, mais supportés)
- `message` : Nouveau message dans une conversation
- `application_received` : Candidature reçue pour votre annonce
- `application_accepted` : Votre candidature a été acceptée
- `application_declined` : Votre candidature a été refusée
- `group_added` : Vous avez été ajouté à un groupe
- `follow` : Quelqu'un vous suit
- `welcome` : Notification de bienvenue

## Vérification de l'installation

### Vérifier que les colonnes existent

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND column_name IN ('sender_id', 'group_key', 'metadata');
```

Vous devriez voir les 3 colonnes : `sender_id`, `group_key`, et `metadata`.

### Vérifier que les index existent

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'notifications' 
  AND indexname LIKE 'idx_notifications%';
```

Vous devriez voir plusieurs index, notamment :
- `idx_notifications_user_type_created`
- `idx_notifications_match_types`
- `idx_notifications_news_types`

### Vérifier que les fonctions existent

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_or_update_notification', 'get_notification_counts');
```

### Tester la fonction de statistiques

```sql
-- Remplacer 'VOTRE_USER_ID' par un UUID d'utilisateur réel
SELECT * FROM get_notification_counts('VOTRE_USER_ID'::UUID);
```

## Performance

Les index créés par `optimize_notifications_filters.sql` améliorent significativement les performances des requêtes de filtrage :

- **Index composites** : Permettent de filtrer rapidement par utilisateur + type
- **Index partiels** : Optimisent spécifiquement les filtres "Match" et "Actualité"
- **Index sur les non lues** : Améliorent l'affichage des badges de notifications non lues

## Maintenance

### Nettoyer les anciennes notifications

Le script `update_notifications_system.sql` inclut une fonction `cleanup_old_notifications()` qui peut être exécutée périodiquement :

```sql
-- Supprime les notifications lues de plus de 30 jours
SELECT cleanup_old_notifications();
```

### Analyser les tables périodiquement

Pour maintenir de bonnes performances, exécutez périodiquement :

```sql
ANALYZE notifications;
```

## Dépannage

### Les filtres ne fonctionnent pas

1. Vérifiez que les colonnes `sender_id`, `group_key`, et `metadata` existent
2. Vérifiez que les index ont été créés
3. Vérifiez les logs de la console du navigateur pour les erreurs

### Les performances sont lentes

1. Vérifiez que les index existent (voir section "Vérification")
2. Exécutez `ANALYZE notifications;` pour mettre à jour les statistiques
3. Vérifiez le nombre de notifications dans la table (si > 100k, considérez un nettoyage)

### Les notifications ne s'affichent pas

1. Vérifiez que les triggers sont actifs
2. Vérifiez que les fonctions `create_or_update_notification` existent
3. Vérifiez les permissions RLS (Row Level Security) sur la table `notifications`

## Support

Pour toute question ou problème, consultez :
- La documentation Supabase : https://supabase.com/docs
- Le fichier `README_NOTIFICATIONS.md` pour plus d'informations sur le système de notifications

