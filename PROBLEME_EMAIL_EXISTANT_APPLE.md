# 🔍 Problème : Email Déjà Utilisé avec Apple OAuth

## 🎯 Le Problème

Vous avez un compte créé avec **email/password** (ou Google) avec l'email `votre@email.com`.

Quand vous essayez de vous connecter avec **Apple** en utilisant le **même email**, Supabase rencontre un conflit et retourne une erreur 500.

## ✅ Comportement Normal de Supabase

Normalement, Supabase devrait **lier automatiquement les comptes** (account linking) quand :
- Vous avez un compte avec email/password
- Vous vous connectez avec OAuth (Google/Apple) avec le même email
- Supabase lie les deux méthodes d'authentification au même compte

Mais si ça ne fonctionne pas, cela peut causer une erreur 500.

## 🔍 Diagnostic : Vérifier si le Compte Existe Déjà

Exécutez cette requête SQL dans Supabase pour vérifier :

```sql
-- Vérifier si un compte avec cet email existe déjà
SELECT 
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  CASE 
    WHEN raw_app_meta_data->>'provider' IS NULL THEN 'email/password'
    ELSE raw_app_meta_data->>'provider'
  END as auth_method
FROM auth.users
WHERE email = 'VOTRE_EMAIL_ICI'
ORDER BY created_at;
```

**Remplacez `VOTRE_EMAIL_ICI` par votre email réel.**

## 🔧 Solutions Possibles

### Solution 1 : Vérifier la Configuration Supabase (Account Linking)

Supabase devrait lier automatiquement les comptes, mais vérifions :

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers**
3. Vérifiez que **Apple** est activé
4. Regardez s'il y a une option pour "Account Linking" ou "Link Accounts" (cela peut varier selon la version de Supabase)

### Solution 2 : Vérifier les Logs Supabase pour l'Erreur Exacte

L'erreur 500 pourrait être causée par :
- Un conflit lors de la création du profil (le trigger échoue)
- Un problème de contrainte unique sur l'email
- Un problème avec le trigger `on_auth_user_created`

1. Allez dans **Logs** → **Auth**
2. Testez la connexion Apple
3. Regardez l'erreur exacte

### Solution 3 : Vérifier si le Trigger Fonctionne avec les Emails Existants

Le trigger `on_auth_user_created` pourrait avoir un problème quand un compte existe déjà.

Exécutez cette requête pour vérifier le trigger :

```sql
-- Vérifier si le trigger existe et fonctionne
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Solution 4 : Vérifier la Table Profiles pour les Conflits

Vérifiez si un profil existe déjà avec cet email :

```sql
-- Vérifier les profils existants
SELECT 
  id,
  email,
  full_name,
  created_at
FROM public.profiles
WHERE email = 'VOTRE_EMAIL_ICI';
```

## 🚨 Solution Temporaire : Tester avec un Autre Email

Pour isoler le problème, testez avec un email différent :

1. Créez un nouveau compte Apple ID avec un email différent (temporairement)
2. Testez la connexion Apple avec ce nouvel email
3. Si ça fonctionne → Le problème vient du conflit avec l'email existant
4. Si ça ne fonctionne pas → Le problème est ailleurs (configuration Apple)

## 📋 Actions Immédiates

1. **Exécutez la requête SQL** ci-dessus pour vérifier si votre email existe déjà dans `auth.users`
2. **Vérifiez les logs Supabase** (Logs → Auth) pour voir l'erreur exacte
3. **Dites-moi** :
   - Votre email existe-t-il déjà dans `auth.users` ?
   - Quel est le message d'erreur exact dans les logs Supabase ?
   - Avec quelle méthode vous êtes-vous inscrit initialement ? (email/password, Google, autre ?)

## 🔍 Comportement Attendu

Si votre email existe déjà avec email/password (ou Google), et que vous vous connectez avec Apple :

**Comportement normal** :
- Supabase devrait lier les comptes
- Vous devriez avoir accès avec les deux méthodes (email/password et Apple)
- Le même profil devrait être utilisé

**Si ça ne fonctionne pas** :
- L'erreur 500 suggère que quelque chose échoue lors du processus de liaison
- Cela peut être un problème de trigger, de contrainte, ou de configuration

Avec ces informations, je pourrai identifier la cause exacte !
