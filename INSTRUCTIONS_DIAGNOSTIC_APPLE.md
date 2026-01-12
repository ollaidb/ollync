# Instructions : Diagnostic Apple OAuth

## 🎯 Problème

Vous pouvez vous connecter avec Apple (vous validez la connexion), mais après :
- Le profil ne s'affiche pas
- C'est comme si rien ne s'était passé

## 📋 Étape 1 : Exécuter le Script de Diagnostic

### Dans Supabase Dashboard

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Votre projet → **SQL Editor** (dans le menu de gauche)
3. Cliquez sur **New query**
4. Ouvrez le fichier `supabase/diagnostic_apple_oauth_complet.sql`
5. Copiez TOUT le contenu
6. Collez-le dans l'éditeur SQL
7. Cliquez sur **Run** (ou appuyez sur Cmd/Ctrl + Enter)

### Résultats à Noter

Regardez particulièrement :

1. **Section 1** : Le trigger existe-t-il ? (doit être "on_auth_user_created")
2. **Section 3** : Combien d'utilisateurs Apple n'ont PAS de profil ? (c'est probablement votre problème)
3. **Section 5** : Statistiques - combien d'utilisateurs Apple vs combien de profils

## 📋 Étape 2 : Vérifier dans la Console du Navigateur

1. Ouvrez la console (F12 → Console)
2. Connectez-vous avec Apple
3. Regardez les messages dans la console :
   - Y a-t-il `🔐 Détection callback OAuth` ?
   - Y a-t-il `✅ Session OAuth récupérée` ?
   - Y a-t-il `🔍 Vérification du profil` ?
   - Y a-t-il des erreurs en rouge ?

## 🔧 Solutions Probables

### Si des Utilisateurs Apple n'ont pas de Profil

**Exécutez ce script** :
1. Dans SQL Editor, copiez le contenu de `supabase/manual_create_profiles_for_oauth_users.sql`
2. Exécutez-le
3. Cela créera les profils manquants

### Si le Trigger n'existe pas

**Exécutez ce script** :
1. Dans SQL Editor, copiez le contenu de `supabase/complete_oauth_fix.sql`
2. Exécutez-le
3. Cela créera le trigger et les profils manquants

### Si le Trigger existe mais ne fonctionne pas

**Exécutez ce script** :
1. Dans SQL Editor, copiez le contenu de `supabase/fix_oauth_profile_creation.sql`
2. Exécutez-le
3. Cela corrigera le trigger

## 📝 Après le Diagnostic

Une fois que vous avez exécuté le script de diagnostic :

1. **Notez les résultats** (surtout section 3 et 5)
2. **Exécutez le script de correction approprié**
3. **Testez à nouveau** la connexion Apple

## ❓ Questions

1. **Combien d'utilisateurs Apple n'ont pas de profil ?** (Section 3)
2. **Le trigger existe-t-il ?** (Section 1)
3. **Y a-t-il des messages dans la console du navigateur ?**

Partagez ces informations et je pourrai vous aider davantage !
