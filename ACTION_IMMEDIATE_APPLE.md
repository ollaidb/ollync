# 🚀 Action Immédiate : Corriger l'Erreur 500 Apple

## 🎯 Le Problème

Vous avez une **erreur 500** lors de la connexion Apple, ce qui empêche :
- ❌ La création de l'utilisateur
- ❌ La création du profil

## ✅ La Solution

Le problème vient presque toujours de la **Secret Key mal formatée** dans Supabase.

## 📋 Actions à Faire MAINTENANT

### Étape 1 : Vérifier la Configuration dans Supabase (5 minutes)

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers** → **Apple**
3. Vérifiez ces 4 champs :

   - **Services ID (Client ID)** : `com.ollync.web`
   - **Secret Key** : ⚠️ **LE PLUS IMPORTANT** - Doit être le contenu COMPLET du fichier .p8
   - **Key ID** : `CN6345M44T` (ou votre Key ID)
   - **Team ID** : `WR5724DCAN` (ou votre Team ID)

### Étape 2 : Corriger la Secret Key (Le Plus Important)

La Secret Key doit être le **contenu COMPLET du fichier .p8** :

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(lignes supplémentaires)
...
-----END PRIVATE KEY-----
```

**Comment faire :**

1. Si vous avez le fichier `.p8` :
   - Ouvrez-le avec un éditeur de texte
   - Sélectionnez TOUT (Cmd+A)
   - Copiez (Cmd+C)
   - Collez dans Supabase

2. Si vous n'avez PAS le fichier `.p8` :
   - Il faut créer une nouvelle Key dans Apple Developer Portal
   - Voir le guide `GUIDE_FORMAT_SECRET_KEY_APPLE.md`

### Étape 3 : Sauvegarder et Tester

1. Cliquez sur **Save** dans Supabase
2. Testez la connexion Apple
3. Vérifiez la console (F12) - l'erreur 500 devrait disparaître

## 📚 Guides Détaillés

- **`SOLUTION_ERREUR_500_APPLE.md`** : Guide complet avec toutes les vérifications
- **`GUIDE_FORMAT_SECRET_KEY_APPLE.md`** : Guide spécifique sur le format de la Secret Key

## ✅ Après Correction

Une fois corrigé :
- ✅ L'erreur 500 disparaîtra
- ✅ L'utilisateur sera créé dans `auth.users`
- ✅ Le profil sera créé automatiquement par le trigger

**Commençons par vérifier la Secret Key dans Supabase !**
