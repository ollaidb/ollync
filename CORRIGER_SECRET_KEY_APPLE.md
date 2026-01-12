# 🔧 Corriger la Secret Key Apple dans Supabase

## ✅ Solution : Remettre la Secret Key Correctement

Oui, vous devez **remettre la Secret Key** dans Supabase, mais assurez-vous qu'elle est au **bon format**.

## 📋 Étape par Étape

### Étape 1 : Vérifier si Vous Avez le Fichier .p8

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Cherchez votre clé "Ollync Sign in with Apple" (ou similaire)

**Si vous voyez la clé :**
- ⚠️ **ATTENTION** : Vous ne pouvez télécharger le fichier .p8 qu'**UNE SEULE FOIS**
- Si vous l'avez déjà téléchargé, vous l'avez quelque part sur votre ordinateur
- Si vous ne l'avez jamais téléchargé, téléchargez-le MAINTENANT (vous ne pourrez plus après)

**Si vous ne voyez pas la clé ou si vous l'avez perdue :**
- Vous devez créer une **nouvelle Key**
- Voir l'Étape 2 ci-dessous

### Étape 2 : Si Vous N'Avez Pas le Fichier .p8

Si vous avez perdu le fichier .p8, vous devez créer une nouvelle clé :

1. **Apple Developer Portal** → **Keys**
2. Cliquez sur **+** (créer une nouvelle clé)
3. **Key Name** : `Ollync Sign in with Apple` (ou un nom similaire)
4. Cochez **Sign in with Apple**
5. Cliquez sur **Continue** → **Register**
6. **Téléchargez IMMÉDIATEMENT le fichier .p8** (vous ne pourrez plus après)
7. **Notez le Key ID** (affiché une seule fois, 10 caractères)

### Étape 3 : Ouvrir le Fichier .p8

1. Trouvez le fichier .p8 sur votre ordinateur
2. Ouvrez-le avec un **éditeur de texte** (TextEdit, VS Code, Notepad, etc.)
3. **Sélectionnez TOUT le contenu** (Cmd+A ou Ctrl+A)
4. **Copiez** (Cmd+C ou Ctrl+C)

### Étape 4 : Format Correct de la Secret Key

La Secret Key doit ressembler à ceci (exemple) :

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(lignes supplémentaires)
...
-----END PRIVATE KEY-----
```

**Points importants :**
- ✅ Doit commencer par `-----BEGIN PRIVATE KEY-----`
- ✅ Doit se terminer par `-----END PRIVATE KEY-----`
- ✅ Contient plusieurs lignes entre les deux
- ✅ Fait environ 800-900 caractères
- ❌ PAS d'espaces en trop au début/fin
- ❌ PAS de caractères supplémentaires

### Étape 5 : Mettre à Jour dans Supabase

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers**
3. Cliquez sur **Apple**
4. Dans le champ **Secret Key**, **remplacez tout le contenu** :
   - Sélectionnez tout (Cmd+A ou Ctrl+A)
   - Supprimez
   - **Collez** le contenu complet du fichier .p8 (que vous avez copié)
5. Vérifiez les autres champs :
   - **Services ID (Client ID)** : `com.ollync.web` (ou votre Services ID)
   - **Key ID** : Le Key ID de 10 caractères (ex: `CN6345M44T`)
   - **Team ID** : Votre Team ID de 10 caractères (ex: `WR5724DCAN`)
6. Cliquez sur **Save** (ou **Enregistrer**)

### Étape 6 : Vérifier

1. Après avoir sauvegardé, testez la connexion Apple
2. Ouvrez la Console du Navigateur (F12 → Console)
3. Si l'erreur 500 disparaît → ✅ C'est corrigé !
4. Si l'erreur persiste → Vérifiez les logs Supabase (Logs → Auth)

## 🚨 Erreurs Courantes

### ❌ Erreur : Copier seulement une partie de la clé
- **Mauvais** : Juste `MIGTAgEAMBMGByqGSM49AgEG...`
- **Bon** : Tout le fichier, avec `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`

### ❌ Erreur : Ajouter des espaces
- **Mauvais** : ` -----BEGIN PRIVATE KEY----- ` (espaces)
- **Bon** : `-----BEGIN PRIVATE KEY-----` (pas d'espaces)

### ❌ Erreur : Copier le Key ID au lieu de la Secret Key
- **Mauvais** : Key ID = `ABC123DEFG`
- **Bon** : Secret Key = contenu complet du fichier .p8

## ✅ Checklist

- [ ] J'ai le fichier .p8 (ou j'en ai créé un nouveau)
- [ ] J'ai ouvert le fichier .p8 dans un éditeur de texte
- [ ] J'ai copié TOUT le contenu (avec BEGIN et END)
- [ ] J'ai collé dans Supabase (champ Secret Key)
- [ ] J'ai vérifié Services ID, Key ID, Team ID
- [ ] J'ai cliqué sur Save
- [ ] J'ai testé la connexion Apple

## 🆘 Si Vous N'Avez Pas le Fichier .p8

Si vous ne pouvez pas récupérer le fichier .p8, vous devez :
1. Créer une **nouvelle Key** dans Apple Developer Portal
2. Télécharger le nouveau fichier .p8
3. Noter le nouveau Key ID
4. Mettre à jour Supabase avec :
   - Le nouveau fichier .p8 (Secret Key)
   - Le nouveau Key ID
5. Vérifier que le Services ID utilise bien cette nouvelle Key

**Suivez ces étapes et dites-moi si ça fonctionne !**
