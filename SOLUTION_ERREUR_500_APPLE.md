# 🔧 Solution pour l'Erreur 500 Apple OAuth

## 🎯 Problème Identifié

Vous avez une **erreur 500 (Internal Server Error)** lors du callback Apple OAuth :
```
POST https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback → 500
{"code":500,"error_code":"unexpected_failure"}
```

Cette erreur empêche :
- ❌ La création de l'utilisateur dans `auth.users`
- ❌ La création du profil dans `public.profiles`

## 🔍 Cause Probable

L'erreur 500 lors du callback OAuth Apple est généralement causée par :

1. **Secret Key mal formaté** dans Supabase (le plus courant)
2. **Services ID (Client ID) incorrect**
3. **Key ID incorrect ou manquant**
4. **Team ID incorrect ou manquant**

## ✅ Solution : Vérifier et Corriger la Configuration Apple dans Supabase

### Étape 1 : Vérifier la Configuration dans Supabase

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers**
3. Cliquez sur **Apple**
4. Vérifiez que les champs suivants sont **exactement remplis** :

#### Champs Requis :

1. **Services ID (Client ID)** :
   - Format : `com.ollync.web` (ou votre Services ID)
   - Doit correspondre EXACTEMENT à celui dans Apple Developer Portal

2. **Secret Key** :
   - ⚠️ **C'est le problème le plus courant !**
   - Doit être un **JWT complet** (pas juste la clé privée)
   - Format : C'est un long texte qui commence par `-----BEGIN PRIVATE KEY-----`
   - C'est la **clé privée complète** (.p8) que vous avez téléchargée depuis Apple Developer Portal

3. **Key ID** :
   - Format : `ABC123DEFG` (10 caractères)
   - Trouvable dans Apple Developer Portal → Keys → Votre clé

4. **Team ID** :
   - Format : `ABCD1234EF` (10 caractères)
   - Trouvable dans Apple Developer Portal → Membership (en haut à droite)

### Étape 2 : Vérifier dans Apple Developer Portal

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Trouvez votre clé "Ollync Sign in with Apple" (ou similaire)
4. Notez :
   - **Key ID** (10 caractères)
   - **Team ID** (visible en haut à droite, dans Membership)

5. **Téléchargez la clé privée** (.p8) si vous ne l'avez plus
   - ⚠️ **Important** : Vous ne pouvez la télécharger qu'UNE SEULE FOIS
   - Si vous l'avez perdue, créez une nouvelle clé

### Étape 3 : Formater la Secret Key Correctement

La Secret Key dans Supabase doit contenir :

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(plusieurs lignes)
...
-----END PRIVATE KEY-----
```

⚠️ **Points importants** :
- Doit inclure `-----BEGIN PRIVATE KEY-----` au début
- Doit inclure `-----END PRIVATE KEY-----` à la fin
- Toutes les lignes entre les deux
- Pas d'espaces supplémentaires
- Pas de retours à la ligne inutiles

### Étape 4 : Mettre à Jour Supabase

1. Dans Supabase → Authentication → Providers → Apple
2. Collez la **Secret Key complète** (avec BEGIN et END)
3. Vérifiez que **Key ID** et **Team ID** sont corrects
4. **Sauvegardez**

### Étape 5 : Tester

1. Ouvrez votre application
2. Ouvrez la Console (F12 → Console)
3. Essayez de vous connecter avec Apple
4. Vérifiez :
   - ✅ Plus d'erreur 500
   - ✅ L'utilisateur est créé dans `auth.users`
   - ✅ Le profil est créé automatiquement

## 🚨 Si Vous N'avez Plus la Clé Privée

Si vous avez perdu la clé privée (.p8), vous devez :

1. **Créer une nouvelle Key** dans Apple Developer Portal :
   - Keys → **+** → Cocher "Sign in with Apple"
   - Télécharger la clé (.p8) **immédiatement**
   - Noter le **Key ID**

2. **Mettre à jour Supabase** avec :
   - La nouvelle Secret Key (fichier .p8 complet)
   - Le nouveau Key ID

3. **Mettre à jour le Services ID** si nécessaire :
   - Identifiers → Votre Services ID → Configure
   - Vérifier que la Key est bien associée

## 📋 Checklist de Vérification

- [ ] Services ID (Client ID) dans Supabase = Services ID dans Apple Developer Portal
- [ ] Secret Key dans Supabase = fichier .p8 complet (avec BEGIN/END)
- [ ] Key ID dans Supabase = Key ID dans Apple Developer Portal
- [ ] Team ID dans Supabase = Team ID dans Apple Developer Portal
- [ ] Apple est activé dans Supabase (toggle ON)
- [ ] Services ID a "Sign in with Apple" activé dans Apple Developer Portal
- [ ] Domaine et Return URLs corrects dans Apple Developer Portal

## 🔍 Vérification après Correction

Après avoir corrigé la configuration, vérifiez dans la base de données :

```sql
-- Vérifier si l'utilisateur Apple a été créé
SELECT 
  id, 
  email, 
  created_at,
  raw_app_meta_data->>'provider' as provider
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple'
ORDER BY created_at DESC
LIMIT 5;
```

Si l'utilisateur apparaît, le profil sera créé automatiquement par le trigger !
