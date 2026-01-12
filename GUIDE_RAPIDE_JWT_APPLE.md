# ⚡ Guide Rapide : Générer JWT Apple pour Supabase

## ✅ Situation

- Supabase demande un **JWT** (pas la Private Key directement)
- Client ID dans Supabase : `com.ollync.web`
- Vous avez la Private Key : ✅

## 🚀 Solution Rapide

### Option 1 : Utiliser le Script Node.js (Recommandé)

1. **Installez Node.js** si vous ne l'avez pas
2. **Dans le terminal**, exécutez :
   ```bash
   npm install jsonwebtoken
   node generate-apple-jwt.js
   ```
3. **Copiez le JWT** qui s'affiche
4. **Dans Supabase** → Authentication → Providers → Apple → Secret Key
5. **Collez le JWT** et sauvegardez

### Option 2 : Utiliser un Service en Ligne

Si vous ne voulez pas utiliser Node.js, vous pouvez utiliser un service comme [jwt.io](https://jwt.io/) mais vous devrez signer manuellement (plus compliqué).

## 📋 Informations Utilisées

- **Team ID** : `WR5724DCAN`
- **Key ID** : `CN6345M44T`
- **Client ID** : `com.ollync.web` ⚠️ IMPORTANT
- **Private Key** : Déjà dans le script

## ✅ Après Avoir Généré le JWT

1. Copiez le JWT complet
2. Dans Supabase → Authentication → Providers → Apple
3. Champ **Secret Key** : Collez le JWT
4. Cliquez sur **Save**
5. Testez la connexion Apple

## 🚨 Important

Le JWT doit utiliser `com.ollync.web` (pas `com.ollync.mobile`), car c'est votre Client ID dans Supabase.

**Le script `generate-apple-jwt.js` est prêt à utiliser !**
