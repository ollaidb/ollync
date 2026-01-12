# Vérification Finale : Configuration Supabase pour Apple OAuth

## ✅ Ce qui est fait côté Apple Developer

- Services ID créé : `com.ollync.web` ✓
- Sign in with Apple activé ✓
- URLs configurées ✓
- Clé créée : Key ID `CN6345M44T` ✓
- Team ID : `WR5724DCAN` ✓

## 🔧 Vérification dans Supabase Dashboard

### 1. Activer le Provider Apple

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Votre projet → **Authentication** → **Providers**
3. Trouvez **Apple** dans la liste
4. Vérifiez que le toggle **Enable Apple provider** est **ACTIVÉ**

### 2. Vérifier les identifiants

Dans Supabase Dashboard → Authentication → Providers → Apple, vérifiez que ces champs sont remplis :

- [ ] **Services ID** : `com.ollync.web` (doit être EXACTEMENT celui-ci, sans espaces)
- [ ] **Team ID** : `WR5724DCAN` (votre Team ID)
- [ ] **Key ID** : `CN6345M44T` (l'ID de votre clé)
- [ ] **Private Key** : Le contenu COMPLET du fichier `.p8`
  - Doit inclure `-----BEGIN PRIVATE KEY-----`
  - Doit inclure `-----END PRIVATE KEY-----`
  - Doit inclure toutes les lignes entre les deux
  - ⚠️ Pas d'espaces en trop au début ou à la fin

### 3. Vérifier les URLs dans Supabase

1. **Authentication** → **URL Configuration**
2. Vérifiez que :
   - **Site URL** : `https://ollync.app`
   - **Redirect URLs** : Contient `https://ollync.app/**`

## 🧪 Tester et Vérifier les Erreurs

### Test 1 : Tester la connexion

1. Allez sur `https://ollync.app/auth/login`
2. Cliquez sur "Se connecter avec Apple"
3. Notez exactement ce qui se passe

### Test 2 : Vérifier les logs du navigateur

1. Ouvrez la console du navigateur (F12 → Console)
2. Cliquez sur "Se connecter avec Apple"
3. Regardez les erreurs dans la console
4. **Notez le message d'erreur exact**

### Test 3 : Vérifier les logs Supabase

1. Dans Supabase Dashboard → **Logs** → **Auth**
2. Filtrez sur "apple" ou "error"
3. Regardez les erreurs récentes
4. **Notez le message d'erreur exact**

## 🔍 Erreurs Courantes

### Erreur : "invalid_client" ou "invalid_request"

**Cause** : Services ID incorrect dans Supabase
**Solution** : Vérifiez que le Services ID dans Supabase est EXACTEMENT `com.ollync.web` (sans espaces)

### Erreur : "redirect_uri_mismatch"

**Cause** : Return URL incorrecte dans Apple Developer
**Solution** : Vérifiez que la Return URL dans Apple Developer est EXACTEMENT `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

### Erreur : Problème avec la Private Key

**Cause** : Private Key mal formatée
**Solution** : 
- Vérifiez que vous avez copié TOUT le contenu du fichier `.p8`
- Incluez les lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`
- Pas d'espaces en trop

### Rien ne se passe / La page ne s'ouvre pas

**Cause** : Provider non activé ou identifiants manquants
**Solution** : Vérifiez que tous les champs sont remplis dans Supabase

## 📋 Checklist de Vérification

- [ ] Provider Apple activé dans Supabase ?
- [ ] Services ID correct : `com.ollync.web` ?
- [ ] Team ID correct : `WR5724DCAN` ?
- [ ] Key ID correct : `CN6345M44T` ?
- [ ] Private Key complète (avec BEGIN et END) ?
- [ ] Site URL : `https://ollync.app` ?
- [ ] Redirect URLs contient `https://ollync.app/**` ?
- [ ] Test effectué et erreur notée ?

## ❓ Questions pour vous

1. **Dans Supabase, le provider Apple est-il activé ?**
2. **Tous les champs sont-ils remplis** (Services ID, Team ID, Key ID, Private Key) ?
3. **Quand vous cliquez sur "Se connecter avec Apple", que se passe-t-il exactement ?**
4. **Y a-t-il une erreur dans la console du navigateur ?** (Si oui, quel est le message exact ?)
5. **Y a-t-il des erreurs dans les logs Supabase ?** (Dashboard → Logs → Auth)

Répondez à ces questions et je pourrai vous aider à résoudre le problème précis !
