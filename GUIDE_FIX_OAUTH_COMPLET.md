# 🔧 Guide Complet - Réparer OAuth Google et Apple

## 🚨 Problèmes Identifiés

1. **Google OAuth** : L'utilisateur se connecte mais le profil n'est pas créé ou la session ne persiste pas
2. **Apple OAuth** : Rien ne fonctionne

## ✅ Solution en 3 Étapes

### Étape 1 : Exécuter le Script SQL Complet

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu du fichier `supabase/complete_oauth_fix.sql`
3. Cliquez sur **RUN** ou **Exécuter**
4. Vérifiez qu'il n'y a pas d'erreurs

Ce script va :
- ✅ Vérifier/créer la colonne `avatar_url`
- ✅ Créer/améliorer la fonction `handle_new_user()`
- ✅ Recréer le trigger `on_auth_user_created`
- ✅ **Créer les profils pour TOUS les utilisateurs OAuth existants**

### Étape 2 : Vérifier les Résultats

Après avoir exécuté le script, vérifiez dans Supabase :

1. **Table `profiles`** :
   ```sql
   SELECT p.*, au.raw_app_meta_data->>'provider' as provider
   FROM profiles p
   INNER JOIN auth.users au ON p.id = au.id
   WHERE au.raw_app_meta_data->>'provider' IN ('google', 'apple')
   ORDER BY p.created_at DESC;
   ```

2. **Utilisateurs OAuth sans profil** (devrait être 0) :
   ```sql
   SELECT au.id, au.email, au.raw_app_meta_data->>'provider' as provider
   FROM auth.users au
   LEFT JOIN public.profiles p ON au.id = p.id
   WHERE (
     au.raw_app_meta_data->>'provider' = 'google' 
     OR au.raw_app_meta_data->>'provider' = 'apple'
   )
   AND p.id IS NULL;
   ```

### Étape 3 : Tester à Nouveau

#### Pour Google :

1. **Déconnectez-vous complètement** :
   - Ouvrez DevTools → Application → Local Storage
   - Supprimez toutes les clés `sb-*`
   - Supprimez aussi dans Session Storage

2. **Reconnectez-vous** :
   - Allez sur `/auth/login`
   - Cliquez sur "Se connecter avec Google"
   - Autorisez l'application

3. **Vérifiez les logs dans la console** :
   - `🔍 Vérification du profil pour l'utilisateur`
   - `✅ Profil créé avec succès` OU `✅ Profil existe déjà`
   - `🔄 Événement d'authentification: SIGNED_IN`

4. **Rechargez la page** (F5)
   - Vous devriez rester connecté
   - Le profil devrait être présent

#### Pour Apple :

1. **Vérifiez la configuration dans Supabase** :
   - Dashboard → Authentication → Providers → Apple
   - Vérifiez que :
     - ✅ "Enable Sign in with Apple" est activé
     - ✅ Client IDs est rempli : `com.ollync.web`
     - ✅ Secret Key (for OAuth) est rempli
     - ⚠️ **Attention** : Les clés Apple expirent tous les 6 mois !

2. **Testez la connexion** :
   - Allez sur `/auth/login`
   - Cliquez sur "S'inscrire avec Apple"
   - Connectez-vous avec votre compte Apple

3. **Vérifiez les logs** :
   - Mêmes logs que pour Google

## 🐛 Diagnostic

### Si Google ne fonctionne toujours pas :

1. **Vérifiez dans la console du navigateur** :
   - Ouvrez F12 → Console
   - Regardez les erreurs en rouge
   - Regardez les logs avec 🔍, ✅, ❌

2. **Vérifiez dans Supabase Dashboard** :
   - Authentication → Users
   - Vérifiez si l'utilisateur Google est présent
   - Regardez les métadonnées (`raw_user_meta_data`)

3. **Vérifiez la table `profiles`** :
   - Table Editor → profiles
   - Cherchez l'ID de l'utilisateur Google
   - Vérifiez si le profil existe

### Si Apple ne fonctionne toujours pas :

1. **Vérifiez que Apple est bien configuré** :
   - Dashboard → Authentication → Providers → Apple
   - Tous les champs doivent être remplis

2. **Vérifiez les logs Supabase** :
   - Dashboard → Logs → Postgres Logs
   - Cherchez les erreurs liées à Apple

3. **Vérifiez dans Apple Developer Portal** :
   - Les identifiants doivent correspondre
   - Les URLs de redirection doivent être correctes

## 📝 Scripts SQL Disponibles

1. **`supabase/complete_oauth_fix.sql`** ⭐ **UTILISEZ CELUI-CI EN PREMIER**
   - Script complet qui fait tout

2. **`supabase/debug_oauth_profile.sql`** 
   - Pour diagnostiquer le problème

3. **`supabase/manual_create_profiles_for_oauth_users.sql`**
   - Pour créer manuellement les profils

4. **`supabase/fix_oauth_profile_creation.sql`**
   - Pour corriger uniquement le trigger

## 🆘 Si Rien Ne Fonctionne

1. **Exécutez le script SQL `complete_oauth_fix.sql`**
2. **Vérifiez les logs dans la console du navigateur**
3. **Vérifiez les logs dans Supabase Dashboard → Logs**
4. **Créez manuellement un profil pour tester** :
   ```sql
   -- Remplacer USER_ID par un ID d'utilisateur réel
   INSERT INTO public.profiles (id, email, full_name)
   SELECT id, email, raw_user_meta_data->>'full_name'
   FROM auth.users
   WHERE id = 'USER_ID_HERE'::UUID
   ON CONFLICT (id) DO NOTHING;
   ```

## ✅ Checklist Finale

- [ ] Script SQL `complete_oauth_fix.sql` exécuté sans erreur
- [ ] Tous les utilisateurs OAuth existants ont un profil dans `profiles`
- [ ] Le trigger `on_auth_user_created` existe
- [ ] Google OAuth est activé dans Supabase Dashboard
- [ ] Apple OAuth est activé dans Supabase Dashboard (si nécessaire)
- [ ] Les logs dans la console montrent `✅ Profil créé avec succès`
- [ ] La session persiste après rechargement de la page

