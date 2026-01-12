# 🔑 Guide : Format de la Secret Key Apple pour Supabase

## ⚠️ Problème Courant

L'erreur 500 lors du callback Apple OAuth est souvent causée par une **Secret Key mal formatée** dans Supabase.

## ✅ Format Correct

La Secret Key dans Supabase doit être le **contenu COMPLET du fichier .p8** que vous avez téléchargé depuis Apple Developer Portal.

### Exemple de Format Correct

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(lignes supplémentaires)
...
-----END PRIVATE KEY-----
```

## 📋 Comment Obtenir la Bonne Format

### Option 1 : Ouvrir le Fichier .p8

1. Si vous avez le fichier `.p8` :
   - Ouvrez-le avec un éditeur de texte (TextEdit, VS Code, etc.)
   - **Sélectionnez TOUT le contenu** (Cmd+A)
   - **Copiez** (Cmd+C)
   - **Collez** dans Supabase

### Option 2 : Créer une Nouvelle Key

Si vous avez perdu le fichier .p8 :

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Cliquez sur **+** pour créer une nouvelle clé
4. **Key Name** : `Ollync Sign in with Apple`
5. Cochez **Sign in with Apple**
6. Cliquez sur **Continue** → **Register**
7. **Téléchargez immédiatement** le fichier .p8
8. **Notez le Key ID** (affiché une seule fois)
9. Ouvrez le fichier .p8 et copiez TOUT son contenu

## 🔍 Vérification

La Secret Key doit :
- ✅ Commencer par `-----BEGIN PRIVATE KEY-----`
- ✅ Se terminer par `-----END PRIVATE KEY-----`
- ✅ Contenir plusieurs lignes entre les deux
- ✅ Ne pas avoir d'espaces en début/fin
- ✅ Faire environ 800-900 caractères (dépend de la clé)

## ❌ Erreurs Courantes

1. **Copier seulement une partie de la clé**
   - ❌ Mauvais : `MIGTAgEAMBMGByqGSM49AgEG...`
   - ✅ Bon : `-----BEGIN PRIVATE KEY-----` + toutes les lignes + `-----END PRIVATE KEY-----`

2. **Ajouter des espaces ou caractères supplémentaires**
   - ❌ Mauvais : ` -----BEGIN PRIVATE KEY----- `
   - ✅ Bon : `-----BEGIN PRIVATE KEY-----`

3. **Copier le Key ID au lieu de la Secret Key**
   - ❌ Mauvais : Key ID = `ABC123DEFG`
   - ✅ Bon : Secret Key = contenu complet du fichier .p8

4. **Copier seulement la clé privée sans BEGIN/END**
   - ❌ Mauvais : Juste les lignes du milieu
   - ✅ Bon : Tout le fichier, y compris BEGIN et END

## 📝 Instructions pour Supabase

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers** → **Apple**
3. Dans le champ **Secret Key**, collez :
   - Le contenu COMPLET du fichier .p8
   - Avec `-----BEGIN PRIVATE KEY-----` au début
   - Avec `-----END PRIVATE KEY-----` à la fin
4. Vérifiez les autres champs :
   - **Services ID (Client ID)** : `com.ollync.web`
   - **Key ID** : Le Key ID de 10 caractères
   - **Team ID** : Votre Team ID de 10 caractères
5. **Sauvegardez**

## ✅ Test

Après avoir mis à jour la Secret Key :

1. Testez la connexion Apple
2. Vérifiez la console du navigateur
3. L'erreur 500 devrait disparaître
4. L'utilisateur devrait être créé dans `auth.users`
5. Le profil devrait être créé automatiquement
