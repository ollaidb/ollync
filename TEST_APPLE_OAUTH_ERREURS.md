# Test et Diagnostic Apple OAuth

## ✅ Configuration Supabase visible

- ✅ Enable Sign in with Apple : Activé
- ✅ Client IDs : `com.ollync.web` (correct)
- ✅ Secret Key : Présent (masqué)
- ✅ Callback URL : Correct

## 🧪 Test à Effectuer

### Test 1 : Tester la connexion Apple

1. Allez sur `https://ollync.app/auth/login`
2. Cliquez sur "Se connecter avec Apple"
3. **Observez exactement ce qui se passe** :
   - La page Apple s'ouvre-t-elle ?
   - Une erreur s'affiche-t-elle ?
   - Rien ne se passe ?
   - La page reste en chargement ?

### Test 2 : Vérifier les erreurs dans la console

1. Ouvrez la console du navigateur :
   - **Windows/Linux** : F12 ou Ctrl+Shift+I
   - **Mac** : Cmd+Option+I
2. Allez dans l'onglet **Console**
3. Cliquez sur "Se connecter avec Apple"
4. **Regardez les messages d'erreur** dans la console
5. **Copiez les messages d'erreur exacts**

### Test 3 : Vérifier les logs Supabase

1. Dans Supabase Dashboard → **Logs** → **Auth**
2. Cliquez sur "Se connecter avec Apple" dans l'application
3. Regardez les logs récents
4. **Notez les erreurs** (s'il y en a)

## 🔍 Erreurs Possibles

### Erreur : "invalid_client" ou "invalid_request"

**Cause possible** : Secret Key incorrect ou mal formaté
**Solution** : Vérifier que le Secret Key est bien le JWT généré avec Team ID, Key ID et Private Key

### Erreur : "redirect_uri_mismatch"

**Cause possible** : Return URL incorrecte dans Apple Developer
**Solution** : Vérifier que la Return URL dans Apple Developer est exactement `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

### Rien ne se passe

**Cause possible** : Secret Key manquant ou incorrect
**Solution** : Vérifier que le Secret Key est bien rempli

## ⚠️ Note sur le Secret Key

Dans la nouvelle interface Supabase, le "Secret Key" doit être un **JWT (JSON Web Token)** généré avec :
- Team ID
- Key ID  
- Private Key (fichier .p8)

Si vous avez utilisé directement la Private Key au lieu d'un JWT, cela peut causer des problèmes.

## 📋 Informations Nécessaires

Pour vous aider, j'ai besoin de savoir :

1. **Quand vous cliquez sur "Se connecter avec Apple", que se passe-t-il exactement ?**
2. **Y a-t-il une erreur dans la console du navigateur ?** (Si oui, quel est le message exact ?)
3. **Y a-t-il des erreurs dans les logs Supabase ?** (Dashboard → Logs → Auth)
4. **Comment avez-vous rempli le Secret Key ?** (Avez-vous mis le contenu du fichier .p8 ou un JWT ?)

Testez maintenant et dites-moi ce qui se passe !
