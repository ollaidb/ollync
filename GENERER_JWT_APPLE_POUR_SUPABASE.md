# 🔧 Générer un JWT Apple pour Supabase

## ✅ Ce Que Nous Savons

- Supabase affiche : **"Secret key should be a JWT"**
- Votre Client ID dans Supabase : `com.ollync.web`
- Votre JWT précédent utilisait : `com.ollync.mobile` ⚠️
- Vous avez la Private Key : ✅

## 🎯 Solution : Générer un JWT avec le Bon Services ID

Vous devez générer un JWT qui utilise `com.ollync.web` (pas `com.ollync.mobile`).

## 📋 Méthode 1 : Utiliser un Outil en Ligne (Recommandé)

### Option A : Utiliser jwt.io (Manuel)

1. Allez sur [jwt.io](https://jwt.io/)
2. Dans la section "Payload", utilisez :
   ```json
   {
     "iss": "WR5724DCAN",
     "iat": 1767669836,
     "exp": 1970000000,
     "aud": "https://appleid.apple.com",
     "sub": "com.ollync.web"
   }
   ```
3. Dans "VERIFY SIGNATURE", utilisez votre Private Key
4. ⚠️ **Note** : jwt.io ne peut pas signer avec ES256 directement dans le navigateur

### Option B : Utiliser un Script Node.js (Recommandé)

Créez un fichier `generate-jwt.js` :

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Votre Private Key (le contenu complet du fichier .p8)
const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg17Mn8XswNd62yLTU
wHzeHMMX3zarcHv+d2tI/kesCrOgCgYIKoZIzj0DAQehRANCAAT2gRIwo2xRJLwq
OWF6vOCzHUR8UwN1LWJQ1AoURnlkcx+15WEsm+RHlgEtR2M+q1EpHyy3Q3z5zsJ+
ynEHzAcj
-----END PRIVATE KEY-----`;

// Informations
const teamId = 'WR5724DCAN';
const keyId = 'CN6345M44T';
const clientId = 'com.ollync.web'; // ⚠️ IMPORTANT : Utiliser com.ollync.web

// Créer le JWT
const token = jwt.sign(
  {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 mois
    aud: 'https://appleid.apple.com',
    sub: clientId
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId
    }
  }
);

console.log('JWT généré :');
console.log(token);
```

Exécutez :
```bash
npm install jsonwebtoken
node generate-jwt.js
```

## 📋 Méthode 2 : Utiliser le JWT Existant (Si Services ID Correct)

Si votre JWT précédent utilisait `com.ollync.web`, vous pouvez l'utiliser. Mais il utilisait `com.ollync.mobile`, donc vous devez en générer un nouveau.

## ✅ Étapes pour Mettre à Jour dans Supabase

1. **Générez le JWT** avec :
   - **Team ID** : `WR5724DCAN`
   - **Key ID** : `CN6345M44T`
   - **Services ID (sub)** : `com.ollync.web` ⚠️ IMPORTANT

2. **Dans Supabase** :
   - Authentication → Providers → Apple
   - Champ **Secret Key** : Collez le JWT généré
   - Vérifiez que **Client IDs** est `com.ollync.web`
   - Cliquez sur **Save**

3. **Testez** la connexion Apple

## 🚨 Points Importants

- ✅ Le JWT doit utiliser `com.ollync.web` (pas `com.ollync.mobile`)
- ✅ Le JWT doit être signé avec votre Private Key
- ✅ Le JWT doit utiliser l'algorithme ES256
- ✅ Le JWT doit inclure le Key ID dans le header

## 💡 Solution Rapide

Si vous voulez une solution rapide, je peux créer un script Node.js que vous pouvez exécuter pour générer le JWT correctement.

**Voulez-vous que je crée ce script ?**
