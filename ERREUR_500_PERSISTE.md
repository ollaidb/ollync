# 🔍 Erreur 500 Persiste - Vérifications Nécessaires

## ❌ Le Problème

Même après avoir mis le JWT, l'erreur 500 "unexpected_failure" persiste.

## 🔍 Vérifications à Faire

### 1. Vérifier les Logs Supabase (PRIORITÉ)

L'erreur 500 est générique. Les logs Supabase contiennent l'erreur réelle.

1. Allez dans **Supabase Dashboard**
2. **Logs** → **Auth**
3. Testez la connexion Apple (laissez les logs ouverts)
4. Regardez la **dernière erreur** qui apparaît
5. **Copiez le message d'erreur complet**

### 2. Vérifier la Configuration dans Supabase

Dans **Authentication** → **Providers** → **Apple**, vérifiez que :

- ✅ **Enable Sign in with Apple** : Activé (vert)
- ✅ **Client IDs** : `com.ollync.web`
- ✅ **Secret Key** : Le JWT que nous avons généré (devrait être collé)
- ⚠️ **Key ID** : `CN6345M44T` (10 caractères)
- ⚠️ **Team ID** : `WR5724DCAN` (10 caractères)

**Question** : Est-ce que le champ "Key ID" et "Team ID" sont remplis dans Supabase ? (Certaines versions de Supabase ne les demandent pas si vous utilisez un JWT)

### 3. Vérifier la Configuration dans Apple Developer Portal

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Cliquez sur **`com.ollync.web`** (Services ID)
4. Vérifiez que :
   - ✅ **Sign in with Apple** est coché
   - ✅ Cliquez sur **Configure** à côté de "Sign in with Apple"
   - ✅ **Domains and Subdomains** : `ollync.app`
   - ✅ **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

### 4. Vérifier que le Services ID Correspond

**Important** : Dans Apple Developer Portal, le Services ID doit être `com.ollync.web` (pas `com.ollync.mobile`).

Si vous avez créé `com.ollync.mobile` mais que Supabase utilise `com.ollync.web`, il y a un problème.

## 🔍 Erreurs Possibles dans les Logs

Quand vous vérifierez les logs Supabase, cherchez des erreurs comme :

- `invalid_client` → Services ID incorrect
- `invalid_client_secret` → JWT incorrect ou expiré
- `redirect_uri_mismatch` → URL de callback incorrecte dans Apple Developer
- `JWT validation failed` → Problème avec le JWT
- Autre erreur spécifique

## 📋 Informations à Me Fournir

Pour que je puisse vous aider, j'ai besoin de :

1. **Le message d'erreur exact dans les logs Supabase** (Logs → Auth)
2. **Confirmation** : Le Services ID `com.ollync.web` existe-t-il dans Apple Developer Portal ?
3. **Les URLs configurées** dans Apple Developer Portal pour ce Services ID
4. **Dans Supabase**, y a-t-il des champs "Key ID" et "Team ID" à remplir en plus du JWT ?

**La première chose à faire : Vérifier les logs Supabase (Logs → Auth) et me donner l'erreur exacte !**
