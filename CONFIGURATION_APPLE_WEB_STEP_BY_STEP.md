# Guide Étape par Étape : Configuration Apple OAuth pour Web (ollync.app)

## ⚠️ IMPORTANT : Services ID vs App ID

Pour une application **WEB** (ollync.app), vous devez utiliser un **Services ID**, PAS un App ID.

- **App ID** (`com.ollync.mobile`) = Pour apps natives iOS/macOS
- **Services ID** (`com.ollync.web`) = Pour sites web

## 📋 Étape 1 : Créer un Services ID

### 1.1 Accéder aux Identifiers

1. Dans Apple Developer Portal, allez dans **Certificates, Identifiers & Profiles**
2. Dans le menu de gauche, cliquez sur **Identifiers** (pas "Services")
3. En haut à droite, cliquez sur le bouton **+** (plus)

### 1.2 Sélectionner Services IDs

1. Sélectionnez **Services IDs**
2. Cliquez sur **Continue**

### 1.3 Configurer le Services ID

1. **Description** : Entrez `Ollync Web` (ou un nom de votre choix)
2. **Identifier** : Entrez `com.ollync.web` (ou un identifiant unique de votre choix)
   - ⚠️ Doit être unique et différent de votre App ID
3. Cliquez sur **Continue**
4. Vérifiez les informations et cliquez sur **Register**

## 📋 Étape 2 : Configurer Sign in with Apple pour le Services ID

### 2.1 Ouvrir la configuration

1. Dans la liste des Identifiers, trouvez votre Services ID (`com.ollync.web`)
2. Cliquez dessus pour l'ouvrir

### 2.2 Activer Sign in with Apple

1. Cochez la case **Sign in with Apple**
2. Cliquez sur le bouton **Configure** à côté de "Sign in with Apple"

### 2.3 Configurer les URLs

1. **Primary App ID** : 
   - Sélectionnez votre App ID principal (ex: `com.ollync.mobile`)
   - OU créez-en un nouveau si nécessaire

2. **Website URLs** :
   - **Domains and Subdomains** : Entrez `ollync.app`
   - **Return URLs** : Entrez `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
     - ⚠️ Remplacez `abmtxvyycslskmnmlniq` par votre projet ID Supabase si différent
     - ⚠️ L'URL doit être EXACTE (sans slash à la fin)

3. Cliquez sur **Save**
4. Cliquez sur **Continue**
5. Cliquez sur **Register**

## 📋 Étape 3 : Créer une Clé (Key)

### 3.1 Accéder aux Keys

1. Dans le menu de gauche, cliquez sur **Keys**
2. En haut à droite, cliquez sur le bouton **+** (plus)

### 3.2 Configurer la clé

1. **Key Name** : Entrez `Ollync Sign in with Apple` (ou un nom de votre choix)
2. Cochez la case **Sign in with Apple**
3. Cliquez sur **Configure** à côté de "Sign in with Apple"
4. **Primary App ID** : Sélectionnez votre App ID principal (ex: `com.ollync.mobile`)
5. Cliquez sur **Save**
6. Cliquez sur **Continue**
7. Cliquez sur **Register**

### 3.3 Télécharger la clé

⚠️ **TRÈS IMPORTANT** : Vous ne pourrez télécharger cette clé qu'**une seule fois** !

1. Sur la page de confirmation, cliquez sur **Download**
2. Le fichier `.p8` sera téléchargé
3. **Sauvegardez-le dans un endroit sûr** (vous ne pourrez plus le télécharger)
4. **Notez le Key ID** affiché (vous en aurez besoin pour Supabase)

## 📋 Étape 4 : Récupérer votre Team ID

1. En haut à droite du portail Apple Developer, cliquez sur votre nom (Binta Diallo)
2. Votre **Team ID** s'affiche (format : `WR5724DCAN` dans votre cas)
3. **Notez-le**, vous en aurez besoin pour Supabase

## 📋 Étape 5 : Configurer dans Supabase

### 5.1 Accéder aux Providers

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Providers**
4. Trouvez **Apple** dans la liste

### 5.2 Activer le Provider

1. Activez le toggle **Enable Apple provider**

### 5.3 Remplir les identifiants

1. **Services ID** : Entrez `com.ollync.web` (le Services ID que vous avez créé)
2. **Team ID** : Entrez votre Team ID (ex: `WR5724DCAN`)
3. **Key ID** : Entrez le Key ID de la clé que vous avez créée
4. **Private Key** : 
   - Ouvrez le fichier `.p8` que vous avez téléchargé dans un éditeur de texte
   - Copiez **TOUT** le contenu (y compris les lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`)
   - Collez-le dans le champ Private Key

5. Cliquez sur **Save**

## 📋 Étape 6 : Vérifier les URLs dans Supabase

1. Allez dans **Authentication** → **URL Configuration**
2. Vérifiez que :
   - **Site URL** : `https://ollync.app`
   - **Redirect URLs** : Contient `https://ollync.app/**`

## ✅ Vérification Finale

Après avoir complété toutes les étapes, vérifiez :

- [ ] Services ID créé (`com.ollync.web`)
- [ ] Sign in with Apple activé pour le Services ID
- [ ] Domaines et Return URLs configurés
- [ ] Clé créée et fichier `.p8` téléchargé
- [ ] Team ID noté
- [ ] Provider Apple activé dans Supabase
- [ ] Tous les identifiants remplis dans Supabase
- [ ] URLs configurées dans Supabase

## 🧪 Test

1. Allez sur `https://ollync.app/auth/login`
2. Cliquez sur "Se connecter avec Apple"
3. Vous devriez être redirigé vers la page de connexion Apple
4. Après connexion, vous devriez être redirigé vers `/home`

## 🆘 Si ça ne fonctionne toujours pas

Vérifiez :
1. Les logs dans la console du navigateur (F12)
2. Les logs dans Supabase Dashboard → Logs → Auth
3. Que le Services ID dans Supabase correspond EXACTEMENT à celui créé
4. Que la Return URL est EXACTE (pas d'espace, pas de slash à la fin)
