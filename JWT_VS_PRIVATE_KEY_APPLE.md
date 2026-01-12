# 🔍 JWT vs Private Key pour Apple OAuth dans Supabase

## ⚠️ Important : Différence Entre JWT et Private Key

Vous avez fourni un **JWT (JSON Web Token)**, mais Supabase nécessite généralement la **Private Key (.p8) directement**, pas un JWT.

## 🔍 Votre JWT

Votre JWT contient :
- **Key ID** : `CN6345M44T` ✅
- **Team ID** : `WR5724DCAN` ✅
- **Services ID (sub)** : `com.ollync.mobile` ⚠️
- **Expiration** : Le JWT expire à un moment donné

## ⚠️ Problèmes Potentiels

1. **Services ID différent** : Votre JWT utilise `com.ollync.mobile` mais dans les guides précédents, nous utilisions `com.ollync.web`
   - Vérifiez quel Services ID vous utilisez dans Supabase

2. **JWT vs Private Key** : Supabase peut nécessiter la Private Key directement, pas un JWT
   - Certaines versions de Supabase acceptent uniquement la Private Key (.p8)

3. **JWT expiré** : Les JWT expirent après un certain temps

## ✅ Solution : Utiliser la Private Key Directement

Dans Supabase, pour Apple OAuth, utilisez généralement la **Private Key (.p8) directement**, pas un JWT.

### Format Attendu dans Supabase

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(lignes supplémentaires)
...
-----END PRIVATE KEY-----
```

## 📋 Ce Qu'il Faut Faire

1. **Trouvez le fichier .p8** (la clé privée qui a servi à générer ce JWT)
2. **Ouvrez le fichier .p8** dans un éditeur de texte
3. **Copiez TOUT le contenu** du fichier .p8
4. **Dans Supabase** → Authentication → Providers → Apple → Secret Key
5. **Collez le contenu complet** du fichier .p8 (pas le JWT)
6. **Vérifiez le Services ID** : Utilisez-vous `com.ollync.web` ou `com.ollync.mobile` ?

## 🚨 Questions Importantes

1. **Quel Services ID utilisez-vous dans Supabase ?**
   - `com.ollync.web` ?
   - `com.ollync.mobile` ?

2. **Avez-vous le fichier .p8 ?**
   - Si OUI : Utilisez le contenu du fichier .p8 (pas le JWT)
   - Si NON : Vous devez créer une nouvelle Key dans Apple Developer Portal

3. **Dans Supabase, le champ "Secret Key" accepte-t-il :**
   - Un JWT (comme celui que vous avez fourni) ?
   - OU la Private Key directement (fichier .p8) ?

## ✅ Recommandation

**Utilisez la Private Key (.p8) directement**, pas le JWT. C'est la méthode la plus courante pour Supabase.

Si vous n'avez pas le fichier .p8, vous devez créer une nouvelle Key dans Apple Developer Portal.

## 🔍 Vérification dans Supabase

1. Allez dans **Supabase Dashboard** → **Authentication** → **Providers** → **Apple**
2. Regardez le champ **Secret Key**
3. Quelle est la valeur actuelle ? (masquée avec •••)
4. Est-ce un JWT (commence par `eyJ...`) ou une Private Key (commence par `-----BEGIN PRIVATE KEY-----`) ?

**Dites-moi ce que vous voyez dans Supabase et si vous avez le fichier .p8 !**
