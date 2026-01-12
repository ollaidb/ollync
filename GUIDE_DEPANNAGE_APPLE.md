# Guide de Dépannage : Authentification Apple

## 🔍 Diagnostic Rapide

Quand vous cliquez sur "Se connecter avec Apple", que se passe-t-il exactement ?

- [ ] Rien ne se passe (pas de redirection)
- [ ] Une erreur s'affiche (quel message ?)
- [ ] La page Apple s'ouvre mais ça échoue après
- [ ] Autre (décrivez)

## ✅ Checklist de Configuration Apple OAuth

### 1. Prérequis Essentiels

- [ ] **Vous avez un compte Apple Developer payant** ($99/an)
  - Si non, Apple OAuth ne fonctionnera PAS
  - Alternative : Utiliser uniquement Google OAuth

### 2. Configuration dans Apple Developer Portal

#### 2.1 Services ID créé

1. Allez sur [Apple Developer Portal](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Vérifiez qu'un **Services ID** existe (ex: `com.ollync.web`)
4. Si non, créez-le :
   - Cliquez sur **+**
   - Sélectionnez **Services IDs**
   - Description : `Ollync Web`
   - Identifier : `com.ollync.web` (ou votre identifiant unique)

#### 2.2 Sign in with Apple activé

1. Cliquez sur votre **Services ID**
2. Cochez **Sign in with Apple**
3. Cliquez sur **Configure**
4. Vérifiez :
   - **Primary App ID** : Sélectionné (ou créez-en un si nécessaire)
   - **Domains and Subdomains** : `ollync.app`
   - **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
5. Cliquez sur **Save** → **Continue** → **Register**

#### 2.3 Clé créée

1. **Certificates, Identifiers & Profiles** → **Keys**
2. Vérifiez qu'une clé existe pour Sign in with Apple
3. Si non, créez-la :
   - Cliquez sur **+**
   - Key Name : `Ollync Sign in with Apple`
   - Cochez **Sign in with Apple**
   - Configure et sélectionnez votre Primary App ID
   - **IMPORTANT** : Téléchargez le fichier `.p8` (vous ne pourrez le télécharger qu'une seule fois)
   - Notez le **Key ID**

#### 2.4 Team ID récupéré

1. En haut à droite du portail, cliquez sur votre nom
2. Notez votre **Team ID** (format : `XXXXXXXXXX`)

### 3. Configuration dans Supabase Dashboard

#### 3.1 Provider Apple activé

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Votre projet → **Authentication** → **Providers** → **Apple**
3. Vérifiez que le toggle **Enable Apple provider** est **ACTIVÉ**

#### 3.2 Identifiants configurés

Vérifiez que ces champs sont remplis correctement :

- [ ] **Services ID** : Doit être exactement celui créé (ex: `com.ollync.web`)
- [ ] **Team ID** : Votre Team ID Apple Developer
- [ ] **Key ID** : L'ID de la clé créée
- [ ] **Private Key** : Le contenu COMPLET du fichier `.p8`
  - Doit inclure `-----BEGIN PRIVATE KEY-----`
  - Doit inclure `-----END PRIVATE KEY-----`
  - Doit inclure toutes les lignes entre les deux

#### 3.3 URLs de redirection

1. **Authentication** → **URL Configuration**
2. Vérifiez :
   - **Site URL** : `https://ollync.app`
   - **Redirect URLs** : Contient `https://ollync.app/**`

### 4. Vérification dans la Console du Navigateur

Ouvrez la console du navigateur (F12) et testez la connexion Apple :

1. Cliquez sur "Se connecter avec Apple"
2. Regardez les erreurs dans la console
3. Notez les messages d'erreur exacts

## 🐛 Erreurs Courantes et Solutions

### Erreur : "The provider is not enabled"

**Solution** :
- Vérifiez que le toggle "Enable Apple provider" est activé dans Supabase
- Redémarrez l'application après activation

### Erreur : "invalid_client" ou "invalid_request"

**Solutions** :
1. Vérifiez que le **Services ID** dans Supabase correspond EXACTEMENT à celui dans Apple Developer Portal
2. Vérifiez que **Sign in with Apple** est bien activé pour votre Services ID
3. Vérifiez que le domaine `ollync.app` est bien configuré dans Apple Developer Portal

### Erreur : "redirect_uri_mismatch"

**Solutions** :
1. Vérifiez que la **Return URL** dans Apple Developer Portal est EXACTEMENT :
   ```
   https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback
   ```
2. Pas de slash à la fin, pas d'espace
3. Vérifiez que le domaine `ollync.app` est dans "Domains and Subdomains"

### Erreur : Problème avec la Private Key

**Solutions** :
1. Vérifiez que vous avez copié le contenu COMPLET du fichier `.p8`
2. Incluez les lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`
3. Vérifiez qu'il n'y a pas d'espaces en trop
4. Si vous avez perdu le fichier `.p8`, vous devez créer une nouvelle clé dans Apple Developer Portal

### Erreur : "Team ID is invalid"

**Solution** :
- Vérifiez que le Team ID dans Supabase correspond à celui affiché dans Apple Developer Portal (en haut à droite)

### Rien ne se passe quand je clique

**Solutions** :
1. Ouvrez la console du navigateur (F12) et cherchez des erreurs JavaScript
2. Vérifiez que le provider Apple est activé dans Supabase
3. Vérifiez votre connexion internet
4. Testez avec un autre navigateur

### La page Apple s'ouvre mais échoue après connexion

**Solutions** :
1. Vérifiez les logs dans Supabase Dashboard → Logs → Auth
2. Vérifiez que la Return URL est correcte
3. Vérifiez que le domaine est bien configuré
4. Vérifiez la console du navigateur pour les erreurs

## 📝 Informations à Collecter pour le Support

Si le problème persiste, collectez ces informations :

1. **Message d'erreur exact** (depuis la console du navigateur)
2. **Logs Supabase** : Dashboard → Logs → Auth (filtrer sur "apple")
3. **Configuration Apple Developer** :
   - Services ID utilisé
   - Domaine configuré
   - Return URL configurée
4. **Configuration Supabase** :
   - Services ID configuré
   - Team ID configuré
   - Key ID configuré
   - Private Key : Vérifié (sans le partager !)
5. **Navigateur et OS** utilisés

## 🔄 Vérification Rapide en 5 Étapes

1. ✅ Compte Apple Developer actif ?
2. ✅ Services ID créé et Sign in with Apple activé ?
3. ✅ Clé créée et fichier .p8 téléchargé ?
4. ✅ Provider Apple activé dans Supabase ?
5. ✅ Tous les identifiants correctement remplis dans Supabase ?

Si toutes ces étapes sont OK et que ça ne fonctionne toujours pas, vérifiez les logs et les erreurs dans la console.

## ⚠️ Note Importante

Si vous n'avez **pas de compte Apple Developer payant**, Apple OAuth ne fonctionnera pas. Dans ce cas :
- Utilisez uniquement Google OAuth
- Ou inscrivez-vous à Apple Developer Program ($99/an)
