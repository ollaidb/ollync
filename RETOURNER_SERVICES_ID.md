# Retourner sur le Services ID pour Configurer les URLs

## 🔍 Vous êtes actuellement sur

- Page : **Configure Key** (Configuration de la clé)
- C'est pour configurer la clé avec un App ID

## 🎯 Ce qu'il faut faire

Vous devez retourner sur la page du **Services ID** (`com.ollync.web`) pour configurer les URLs.

## 📋 Comment retourner sur le Services ID

### Méthode 1 : Via le menu Identifiers

1. Dans Apple Developer Portal, allez dans **Certificates, Identifiers & Profiles**
2. Cliquez sur **Identifiers** dans le menu de gauche
3. Dans la liste, trouvez **"Ollync web"** (Services ID `com.ollync.web`)
4. **Cliquez sur "Ollync web"**

### Méthode 2 : Utiliser le lien "All Identifiers"

1. Sur la page actuelle, cherchez un lien **"< All Identifiers"** ou **"< All Keys"**
2. Cliquez dessus pour retourner à la liste
3. Allez dans **Identifiers** (pas Keys)
4. Cliquez sur **"Ollync web"**

## ✅ Une fois sur le Services ID

Quand vous êtes sur la page du Services ID `com.ollync.web` :

1. Vous devriez voir "Sign In with Apple" avec une case cochée
2. À droite, vous verrez quelque chose comme : `WR5724DCAN.com.ollync.mobile (2 Website URLs)`
3. **Cliquez sur cette ligne** ou sur la configuration pour voir/modifier les URLs

## 🔍 Ce que vous devez configurer

Sur la page du Services ID (pas de la clé), vous devez voir/éditer :

- **Domains and Subdomains** : `ollync.app`
- **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

## ⚠️ Important

- La page "Configure Key" = Configuration de la clé (déjà faite ✓)
- La page "Services ID" = Configuration des URLs (à faire maintenant)

Retournez sur la page du Services ID "Ollync web" et dites-moi ce que vous voyez !
