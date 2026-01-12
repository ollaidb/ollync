# Vérification : Configuration du Services ID pour Sign in with Apple

## ✅ Ce qui est fait

- Services ID créé : `com.ollync.web` ✓
- Clé créée : Key ID `CN6345M44T` ✓

## 🔍 Ce qu'il faut vérifier maintenant

### 1. Vérifier que Sign in with Apple est activé pour le Services ID

1. Dans Apple Developer Portal, allez dans **Certificates, Identifiers & Profiles**
2. Cliquez sur **Identifiers** dans le menu de gauche
3. Cliquez sur **"Ollync web"** (le Services ID `com.ollync.web`)
4. Vérifiez que la case **Sign in with Apple** est COCHÉE
5. Si elle n'est pas cochée, cochez-la et cliquez sur **Configure**

### 2. Configurer les URLs pour Sign in with Apple

Si vous devez cliquer sur "Configure" ou si ce n'est pas encore configuré :

1. Cliquez sur **Configure** à côté de "Sign in with Apple"
2. **Primary App ID** : Sélectionnez `com.ollync.mobile` (votre App ID existant)
3. **Website URLs** :
   - **Domains and Subdomains** : Entrez `ollync.app`
   - **Return URLs** : Entrez `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
4. Cliquez sur **Save**
5. Cliquez sur **Continue**
6. Cliquez sur **Register**

### 3. Noter les informations nécessaires pour Supabase

Vous avez besoin de :
- ✅ **Services ID** : `com.ollync.web`
- ✅ **Key ID** : `CN6345M44T`
- ✅ **Team ID** : `WR5724DCAN` (visible dans l'image)
- ⚠️ **Private Key** : Avez-vous téléchargé le fichier `.p8` ?

### 4. Télécharger la Private Key (si pas encore fait)

⚠️ **IMPORTANT** : Si vous n'avez pas encore téléchargé le fichier `.p8` :

1. Sur la page de la clé (celle que vous montrez dans l'image)
2. Si le bouton **Download** est disponible (pas grisé), cliquez dessus
3. ⚠️ **ATTENTION** : Vous ne pourrez le télécharger qu'une seule fois
4. Sauvegardez le fichier `.p8` dans un endroit sûr

Si le bouton Download est grisé, cela signifie que vous l'avez déjà téléchargé une fois et que vous ne pouvez plus le télécharger. Dans ce cas, vous devez :
- Soit utiliser le fichier que vous avez déjà téléchargé
- Soit créer une nouvelle clé si vous avez perdu le fichier

## 📋 Checklist de Configuration Complète

Avant de configurer Supabase, assurez-vous que :

- [ ] Services ID `com.ollync.web` existe
- [ ] Sign in with Apple est activé pour le Services ID
- [ ] Domaines configurés : `ollync.app`
- [ ] Return URL configurée : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
- [ ] Clé créée (Key ID : `CN6345M44T`)
- [ ] Fichier `.p8` téléchargé (ou créé une nouvelle clé si perdu)
- [ ] Team ID noté : `WR5724DCAN`

## 🔧 Configuration dans Supabase

Une fois que tout est vérifié ci-dessus :

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Votre projet → **Authentication** → **Providers** → **Apple**
3. Activez le toggle **Enable Apple provider**
4. Remplissez :
   - **Services ID** : `com.ollync.web`
   - **Team ID** : `WR5724DCAN`
   - **Key ID** : `CN6345M44T`
   - **Private Key** : Contenu complet du fichier `.p8`
5. Cliquez sur **Save**

## ❓ Questions

1. **La case "Sign in with Apple" est-elle cochée** pour le Services ID `com.ollync.web` ?
2. **Avez-vous cliqué sur "Configure"** et configuré les domaines et Return URLs ?
3. **Avez-vous le fichier `.p8`** téléchargé ? (Si non, il faudra créer une nouvelle clé)

Dites-moi où vous en êtes et je vous aiderai à continuer !
