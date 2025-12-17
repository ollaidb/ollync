# Migration vers les nouvelles catégories

Ce dossier contient les scripts SQL nécessaires pour migrer la base de données vers le nouveau concept centré sur les créateurs de contenu.

## Nouvelle structure des catégories

### Catégories principales
1. **Création de contenu** (`creation-contenu`)
2. **Casting** (`casting-role`)
3. **Emploi** (`montage`)
4. **Projet** (`projets-equipe`)
5. **Services** (`services`)
6. **Vente** (`vente`)

### Sous-catégories

#### Création de contenu
- Photo
- Vidéo
- Vlog
- Sketchs
- Trends
- Événements

#### Casting
- Figurant
- Modèle photo
- Modèle vidéo
- Voix off
- Invité podcast
- Invité micro-trottoir

#### Emploi
- Montage
- micro-trottoir
- live
- Écriture de contenu

#### Projet
- Recherche équipe
- media
- YouTube
- Podcast
- documentaire
- autre

#### Services
- Coaching contenu
- Stratégie éditoriale
- Organisation
- Setup matériel
- Aide Live / Modération

#### Vente
- Comptes
- Noms d'utilisateur
- Concepts / Niches
- Pack compte + contenu

## Procédure de migration

### Étape 1 : Sauvegarde (OBLIGATOIRE)

Exécutez d'abord le script de sauvegarde dans votre SQL Editor Supabase :

```sql
-- Exécuter: backup_before_migration.sql
```

Ce script crée des tables de sauvegarde pour :
- Les catégories existantes
- Les sous-catégories existantes
- Les associations posts/catégories

### Étape 2 : Migration

Exécutez le script de migration principal :

```sql
-- Exécuter: migrate_to_new_categories.sql
```

Ce script :
1. Crée/met à jour les nouvelles catégories
2. Migre les posts existants vers les nouvelles catégories :
   - `match` → `creation-contenu`
   - `recrutement` / `role` → `casting-role`
   - `mission` → `montage` (Emploi)
   - `service` → `services`
   - `projet` → `projets-equipe`
   - `autre` → `services`
3. Supprime les anciennes catégories
4. Supprime les anciennes sous-catégories
5. Insère les nouvelles sous-catégories
6. Réinitialise les `sub_category_id` des posts (à NULL)

### Étape 3 : Vérification

Le script de migration affiche automatiquement :
- La liste complète des catégories et sous-catégories
- Le nombre de posts par catégorie

Vérifiez que tout est correct avant de continuer.

### Étape 4 : Rollback (si nécessaire)

Si vous devez revenir en arrière, exécutez :

```sql
-- Exécuter: rollback_migration.sql
```

⚠️ **Attention** : Le rollback nécessite que la sauvegarde ait été faite avant la migration.

## Migration des posts

### Mapping des catégories

| Ancienne catégorie | Nouvelle catégorie | Notes |
|-------------------|-------------------|-------|
| `match` | `creation-contenu` | Tout le contenu de création |
| `communication` | `creation-contenu` | Fusionné avec création de contenu |
| `recrutement` / `role` | `casting-role` | Fusion des deux catégories |
| `mission` | `montage` (Emploi) | Services d'emploi |
| `service` | `services` | Même concept, nouveau slug |
| `projet` | `projets-equipe` | Même concept, nouveau slug |
| `autre` | `services` | Catégorie générale de services |

### Sous-catégories

**Important** : Toutes les `sub_category_id` des posts existants seront mises à `NULL` car les sous-catégories ont complètement changé. Les utilisateurs devront peut-être réassigner manuellement leurs sous-catégories si nécessaire.

## Notes importantes

1. ⚠️ **Sauvegarde obligatoire** : Ne sautez jamais l'étape de sauvegarde !
2. 📊 **Vérification** : Vérifiez toujours les résultats de migration avant de continuer
3. 🔄 **Rollback** : Gardez les tables de sauvegarde jusqu'à ce que vous soyez sûr que tout fonctionne
4. 🗑️ **Nettoyage** : Vous pouvez supprimer les tables de sauvegarde après vérification :
   ```sql
   DROP TABLE IF EXISTS categories_backup;
   DROP TABLE IF EXISTS sub_categories_backup;
   DROP TABLE IF EXISTS posts_categories_backup;
   ```

## Structure des fichiers

- `backup_before_migration.sql` - Script de sauvegarde (à exécuter EN PREMIER)
- `migrate_to_new_categories.sql` - Script de migration principal
- `rollback_migration.sql` - Script de rollback en cas de problème

## Support

Si vous rencontrez des problèmes lors de la migration, vérifiez :
1. Que toutes les contraintes de clé étrangère sont correctement gérées
2. Qu'il n'y a pas de posts orphelins (sans catégorie)
3. Que les slugs des nouvelles catégories correspondent à ceux utilisés dans le code frontend

