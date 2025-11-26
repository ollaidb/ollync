# Guide de Synchronisation des Noms - auth.users → profiles

## Problème résolu

Le problème était que deux noms pouvaient s'afficher :
- Un nom depuis la table `profiles`
- Un nom créé automatiquement depuis l'email ou d'autres sources

Maintenant, **un seul nom est utilisé** : celui qui provient de `auth.users` (la table d'authentification Supabase).

## Solution implémentée

### 1. Script SQL de synchronisation

Un nouveau script a été créé : `supabase/sync_auth_to_profiles.sql`

Ce script :
- ✅ Synchronise automatiquement les noms depuis `auth.users` vers `profiles`
- ✅ Met à jour le trigger de création de profil pour utiliser uniquement `auth.users`
- ✅ Crée un trigger qui synchronise `auth.users` → `profiles` à chaque mise à jour
- ✅ Fournit une fonction pour synchroniser tous les profils existants

### 2. Modifications du code

#### `src/pages/profile/PersonalInfo.tsx`
- ✅ Récupère les noms depuis `auth.users` (via `user.user_metadata`)
- ✅ Met à jour `auth.users` au lieu de `profiles` pour les noms
- ✅ Le trigger synchronise automatiquement vers `profiles`

#### `src/pages/Profile.tsx`
- ✅ Supprimé le fallback avec l'email (`user?.email?.split('@')[0]`)
- ✅ Utilise uniquement `profile.full_name || profile.username`

## Installation

### Étape 1 : Exécuter le script SQL

1. Ouvrez votre SQL Editor dans Supabase
2. Exécutez le script : `supabase/sync_auth_to_profiles.sql`
3. Vérifiez que les triggers sont créés correctement

### Étape 2 : Synchroniser les profils existants (optionnel)

Pour corriger les profils existants qui pourraient avoir des noms incorrects :

```sql
SELECT * FROM public.sync_all_profiles_from_auth();
```

Cette fonction synchronisera tous les profils existants avec les données de `auth.users`.

## Fonctionnement

### Lors de l'inscription

1. L'utilisateur s'inscrit avec `full_name` et `username` (optionnels)
2. Ces données sont stockées dans `auth.users.raw_user_meta_data`
3. Le trigger `on_auth_user_created` crée automatiquement un profil dans `profiles`
4. Le profil est créé **uniquement** avec les données de `auth.users` (pas de nom automatique)

### Lors de la mise à jour du profil

1. L'utilisateur modifie son nom dans `PersonalInfo.tsx`
2. Le code met à jour `auth.users` via `supabase.auth.updateUser()`
3. Le trigger `sync_auth_to_profiles_trigger` synchronise automatiquement vers `profiles`
4. Les autres champs (phone, bio, location, avatar_url) sont mis à jour directement dans `profiles`

### Affichage des noms

Partout dans l'application, les noms sont affichés depuis la table `profiles` :
- `profile.full_name || profile.username || 'Utilisateur'`

Comme `profiles` est toujours synchronisé depuis `auth.users`, on a toujours le bon nom.

## Avantages

✅ **Source unique de vérité** : Les noms proviennent toujours de `auth.users`
✅ **Pas de noms automatiques** : Plus de génération de noms depuis l'email
✅ **Synchronisation automatique** : Les triggers gèrent tout automatiquement
✅ **Cohérence** : Impossible d'avoir des noms différents entre `auth.users` et `profiles`
✅ **Pas de suppression** : Les données ne sont jamais supprimées, seulement synchronisées

## Notes importantes

- ⚠️ **Ne supprimez jamais manuellement** un profil dans `profiles` sans supprimer l'utilisateur dans `auth.users`
- ⚠️ **Les noms doivent être modifiés** via `supabase.auth.updateUser()` et non directement dans `profiles`
- ⚠️ **Le trigger synchronise automatiquement**, donc pas besoin de mettre à jour `profiles` manuellement pour les noms

## Vérification

Pour vérifier que tout fonctionne :

1. Créez un nouvel utilisateur
2. Vérifiez que le profil est créé avec les bons noms
3. Modifiez le nom dans l'application
4. Vérifiez que `auth.users` et `profiles` sont synchronisés

```sql
-- Vérifier la synchronisation
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as auth_full_name,
  au.raw_user_meta_data->>'username' as auth_username,
  p.full_name as profile_full_name,
  p.username as profile_username
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LIMIT 10;
```

Les colonnes `auth_*` et `profile_*` doivent être identiques.

