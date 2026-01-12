# Guide de Debug pour les Problèmes OAuth - Création de Profil

## 🔍 Problème Identifié

Après l'inscription via Google ou Apple OAuth, les utilisateurs sont créés dans `auth.users` mais les profils ne sont pas créés dans la table `profiles`.

## 📋 Étapes de Diagnostic

### 1. Vérifier les Utilisateurs OAuth dans Supabase

1. Allez dans votre **Dashboard Supabase** → **Authentication** → **Users**
2. Vérifiez si les utilisateurs Google/Apple sont bien présents
3. Notez les IDs des utilisateurs qui n'ont pas de profil

### 2. Vérifier si le Trigger Existe

Exécutez ce script SQL dans **SQL Editor** de Supabase :

```sql
-- Vérifier si le trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Si le trigger n'existe pas**, exécutez le script `supabase/fix_oauth_profile_creation.sql`

### 3. Vérifier les Utilisateurs OAuth Sans Profil

Exécutez le script `supabase/debug_oauth_profile.sql` pour voir :
- Les utilisateurs OAuth sans profil
- Les détails des métadonnées
- Les statistiques

### 4. Créer Manuellement les Profils Manquants

**Solution rapide** : Exécutez le script `supabase/manual_create_profiles_for_oauth_users.sql`

Ce script va créer automatiquement les profils pour tous les utilisateurs OAuth (Google/Apple) qui n'ont pas encore de profil.

### 5. Vérifier les Logs dans la Console du Navigateur

1. Ouvrez la **Console du Navigateur** (F12 → Console)
2. Connectez-vous avec Google ou Apple
3. Regardez les logs :
   - `🔍 Vérification du profil pour l'utilisateur:` - Le hook vérifie le profil
   - `⚠️ Profil non trouvé (code PGRST116), création en cours...` - Le profil n'existe pas
   - `✅ Profil créé avec succès` - Le profil a été créé
   - `❌ Erreur lors de la création du profil:` - Il y a une erreur

## 🔧 Solutions

### Solution 1 : Exécuter le Script SQL de Correction

1. **Exécutez** `supabase/fix_oauth_profile_creation.sql` dans SQL Editor
   - Ce script vérifie/crée la colonne `avatar_url`
   - Améliore la fonction `handle_new_user()`
   - Recrée le trigger `on_auth_user_created`

2. **Exécutez** `supabase/manual_create_profiles_for_oauth_users.sql`
   - Ce script crée les profils pour les utilisateurs OAuth existants

### Solution 2 : Vérifier les Politiques RLS

Assurez-vous que les politiques RLS permettent l'insertion :

```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Si nécessaire, créer la politique
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Solution 3 : Le Hook useAuth

Le hook `useAuth` a été amélioré pour créer automatiquement le profil si le trigger échoue. Il devrait :
- Détecter quand un utilisateur s'authentifie
- Vérifier si le profil existe
- Créer le profil si nécessaire

**Vérifiez les logs dans la console** pour voir si cette fonctionnalité fonctionne.

## 🧪 Tester

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous** avec Google ou Apple
3. **Vérifiez la console** du navigateur pour les logs
4. **Vérifiez dans Supabase** :
   - Table `auth.users` : L'utilisateur devrait être présent
   - Table `profiles` : Le profil devrait être créé

## ❓ Questions à Vérifier

1. **Le trigger existe-t-il ?**
   - Exécutez la requête SQL de vérification (voir étape 2)

2. **Les politiques RLS permettent-elles l'insertion ?**
   - Vérifiez les politiques (voir Solution 2)

3. **Le hook useAuth fonctionne-t-il ?**
   - Vérifiez les logs dans la console

4. **Y a-t-il des erreurs dans la console ?**
   - Regardez les erreurs JavaScript
   - Regardez les erreurs réseau (onglet Network)

## 📝 Scripts Disponibles

1. **`supabase/debug_oauth_profile.sql`** - Diagnostic
2. **`supabase/fix_oauth_profile_creation.sql`** - Correction du trigger
3. **`supabase/manual_create_profiles_for_oauth_users.sql`** - Créer les profils manquants

## 🆘 Si Rien Ne Fonctionne

1. **Créez manuellement un profil** pour tester :

```sql
-- Remplacer USER_ID par un ID d'utilisateur réel
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id = 'USER_ID_HERE'::UUID
ON CONFLICT (id) DO NOTHING;
```

2. **Vérifiez les logs Supabase** :
   - Dashboard → Logs → Postgres Logs
   - Cherchez les erreurs liées au trigger

3. **Contactez le support** avec :
   - Les logs de la console
   - Les résultats des scripts SQL
   - Les IDs des utilisateurs concernés

