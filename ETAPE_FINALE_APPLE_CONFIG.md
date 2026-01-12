# Étape Finale : Configuration du Services ID et Supabase

## ✅ Ce qui est déjà fait

- Services ID créé : `com.ollync.web` ✓
- Clé créée : Key ID `CN6345M44T` ✓
- Sign in with Apple activé pour la clé ✓
- Services ID groupé avec l'App ID ✓
- Team ID : `WR5724DCAN` ✓

## 🔍 Étape CRUCIALE : Configurer le Services ID

### 1. Ouvrir le Services ID

1. Dans Apple Developer Portal, allez dans **Certificates, Identifiers & Profiles**
2. Cliquez sur **Identifiers** dans le menu de gauche
3. Cliquez sur **"Ollync web"** (le Services ID `com.ollync.web`)

### 2. Vérifier/Activer Sign in with Apple

1. Sur la page du Services ID, vérifiez que la case **Sign in with Apple** est COCHÉE
2. Si elle n'est pas cochée, cochez-la
3. Cliquez sur le bouton **Configure** à côté de "Sign in with Apple"

### 3. Configurer les URLs (TRÈS IMPORTANT)

Quand vous cliquez sur "Configure", vous devez configurer :

1. **Primary App ID** : 
   - Sélectionnez `Ollync Mobile (WR5724DCAN.com.ollync.mobile)`

2. **Website URLs** :
   - **Domains and Subdomains** : Entrez `ollync.app`
     - ⚠️ Pas de `www.`, juste `ollync.app`
   - **Return URLs** : Entrez `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
     - ⚠️ L'URL doit être EXACTE (sans slash à la fin, sans espace)
     - ⚠️ Remplacez `abmtxvyycslskmnmlniq` par votre projet ID Supabase si différent

3. Cliquez sur **Save**
4. Cliquez sur **Continue**
5. Cliquez sur **Register**

## 📋 Informations pour Supabase

Vous avez maintenant toutes les informations nécessaires :

- **Services ID** : `com.ollync.web`
- **Team ID** : `WR5724DCAN`
- **Key ID** : `CN6345M44T`
- **Private Key** : Contenu du fichier `.p8` (avez-vous le fichier ?)

## ⚠️ Question Importante : Fichier .p8

Avez-vous téléchargé le fichier `.p8` de la clé ?

- Si OUI : Ouvrez-le dans un éditeur de texte et copiez tout son contenu
- Si NON : 
  - Retournez sur la page de la clé (View Key)
  - Si le bouton "Download" est grisé, vous l'avez déjà téléchargé
  - Si vous l'avez perdu, vous devrez créer une nouvelle clé

## 🔧 Configuration dans Supabase

Une fois que le Services ID est configuré avec les URLs :

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Votre projet → **Authentication** → **Providers** → **Apple**
3. Activez le toggle **Enable Apple provider**
4. Remplissez les champs :
   - **Services ID** : `com.ollync.web`
   - **Team ID** : `WR5724DCAN`
   - **Key ID** : `CN6345M44T`
   - **Private Key** : 
     - Ouvrez le fichier `.p8` dans un éditeur de texte
     - Copiez TOUT le contenu (y compris `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`)
     - Collez-le dans le champ Private Key
5. Cliquez sur **Save**

## ✅ Vérification Finale dans Supabase

1. Allez dans **Authentication** → **URL Configuration**
2. Vérifiez que :
   - **Site URL** : `https://ollync.app`
   - **Redirect URLs** : Contient `https://ollync.app/**`

## 🧪 Test

Après avoir tout configuré :

1. Allez sur `https://ollync.app/auth/login`
2. Cliquez sur "Se connecter avec Apple"
3. Vous devriez être redirigé vers la page de connexion Apple
4. Après connexion, vous devriez être redirigé vers `/home`

## ❓ Où en êtes-vous ?

1. **Avez-vous cliqué sur le Services ID `com.ollync.web`** et vérifié que Sign in with Apple est activé ?
2. **Avez-vous cliqué sur "Configure"** et configuré les domaines et Return URLs ?
3. **Avez-vous le fichier `.p8`** de la clé ?

Dites-moi où vous en êtes et je vous aiderai à continuer !
