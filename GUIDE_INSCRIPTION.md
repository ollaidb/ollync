# Guide de Configuration pour l'Inscription

## Problème résolu

L'inscription ne fonctionnait pas car :
1. La table `profiles` pouvait ne pas exister ou ne pas avoir la colonne `username`
2. Les politiques RLS (Row Level Security) n'étaient pas correctement configurées
3. Le type TypeScript ne correspondait pas à la structure de la base de données

## Solutions mises en place

### 1. Script SQL pour corriger la table profiles

Exécutez le script `supabase/fix_profiles_table.sql` dans votre SQL Editor Supabase :

1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu de `supabase/fix_profiles_table.sql`
5. Exécutez le script

Ce script va :
- Créer la table `profiles` si elle n'existe pas
- Ajouter la colonne `username` si elle manque
- Configurer les politiques RLS pour permettre l'inscription
- Créer les index et triggers nécessaires

### 2. Trigger automatique pour créer les profils

Exécutez également le script `supabase/create_profile_trigger.sql` :

Ce trigger crée automatiquement un profil dans la table `profiles` lorsqu'un utilisateur s'inscrit via `auth.signUp()`. Cela garantit que chaque utilisateur a un profil associé.

### 3. Mises à jour du code

Les fichiers suivants ont été mis à jour :
- `src/types/database.ts` : Ajout de la colonne `username` dans le type `profiles`
- `src/pages/Register.tsx` : Amélioration de la gestion d'erreurs et utilisation de `upsert` pour éviter les conflits

## Étapes pour activer l'inscription

### ⚠️ IMPORTANT : Exécutez d'abord le script SQL

**L'erreur "Database error saving new user" indique que la table `profiles` n'existe pas ou n'est pas correctement configurée.**

1. **Connectez-vous à Supabase** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor** :
   - Cliquez sur "SQL Editor" dans le menu de gauche

3. **Exécutez le script complet** :
   - **RECOMMANDÉ** : Exécutez `supabase/complete_registration_setup.sql` (script tout-en-un)
   - **OU** exécutez dans l'ordre :
     - `supabase/fix_profiles_table.sql`
     - `supabase/create_profile_trigger.sql`

2. **Vérifiez que la table existe** :
   ```sql
   SELECT * FROM profiles LIMIT 1;
   ```

3. **Vérifiez les politiques RLS** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

4. **Testez l'inscription** :
   - Allez sur `/auth/register`
   - Remplissez le formulaire
   - L'inscription devrait maintenant fonctionner

## Structure de la table profiles

La table `profiles` contient les colonnes suivantes :
- `id` (UUID, PRIMARY KEY) : Référence à `auth.users(id)`
- `email` (VARCHAR) : Email de l'utilisateur
- `username` (VARCHAR, UNIQUE) : Nom d'utilisateur optionnel
- `full_name` (VARCHAR) : Nom complet optionnel
- `avatar_url` (TEXT) : URL de l'avatar
- `phone` (VARCHAR) : Numéro de téléphone
- `bio` (TEXT) : Biographie
- `location` (VARCHAR) : Localisation
- `created_at` (TIMESTAMP) : Date de création
- `updated_at` (TIMESTAMP) : Date de mise à jour

## Politiques RLS (Row Level Security)

Les politiques suivantes sont configurées :
- **SELECT** : Tous les utilisateurs peuvent voir tous les profils
- **UPDATE** : Les utilisateurs peuvent mettre à jour leur propre profil
- **INSERT** : Les utilisateurs peuvent insérer leur propre profil (nécessaire pour l'inscription)

## Dépannage

### Erreur "Database error saving new user" (500)

Cette erreur signifie que :
- La table `profiles` n'existe pas dans votre base de données Supabase
- Les politiques RLS ne sont pas configurées
- Le trigger n'est pas créé

**Solution** : Exécutez le script `supabase/complete_registration_setup.sql` dans votre SQL Editor Supabase.

### Autres problèmes

Si l'inscription ne fonctionne toujours pas :

1. **Vérifiez que la table existe** :
   ```sql
   SELECT * FROM profiles LIMIT 1;
   ```
   Si cette requête échoue, la table n'existe pas. Exécutez le script SQL.

2. **Vérifiez les politiques RLS** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Vous devriez voir 3 politiques (SELECT, UPDATE, INSERT).

3. **Vérifiez le trigger** :
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
   ```
   Le trigger doit exister.

4. **Vérifiez les erreurs dans la console du navigateur** (F12)
5. **Vérifiez les logs Supabase** dans le dashboard (Logs > Postgres Logs)
6. **Vérifiez que l'URL Supabase est correcte** dans `src/lib/supabaseClient.ts`

## Notes importantes

- Le trigger crée automatiquement un profil lors de l'inscription
- Le code utilise `upsert` pour éviter les erreurs si le profil existe déjà
- Les champs `full_name` et `username` sont optionnels lors de l'inscription

