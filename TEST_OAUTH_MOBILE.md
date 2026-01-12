# Checklist de Test OAuth Mobile

## ✅ Tests à Effectuer

### Test 1 : Test Google OAuth sur Mobile

1. **Ouvrez votre navigateur mobile** (Safari sur iOS ou Chrome sur Android)
2. **Allez sur** `https://ollync.app/auth/login`
3. **Cliquez sur "Se connecter avec Google"**
4. **Observez ce qui se passe** :
   - ✅ La page Google s'ouvre-t-elle ?
   - ✅ Pouvez-vous sélectionner votre compte Google ?
   - ✅ Après avoir sélectionné le compte, êtes-vous redirigé vers `/home` ?
   - ✅ Êtes-vous connecté (votre profil apparaît) ?

### Test 2 : Test Apple OAuth sur Mobile (si configuré)

1. **Sur la même page** `/auth/login`
2. **Cliquez sur "Se connecter avec Apple"**
3. **Observez ce qui se passe** (même questions que pour Google)

### Test 3 : Vérifier les Erreurs

Si ça ne fonctionne pas :

1. **Ouvrez la console du navigateur mobile** :
   - **iOS Safari** : Connectez votre iPhone à Mac, puis Safari → Développement → [Votre iPhone] → Console
   - **Android Chrome** : Connectez via USB, puis Chrome → chrome://inspect → Console

2. **Regardez les erreurs** dans la console
3. **Notez les messages d'erreur exacts**

## 🔍 Ce qu'il faut vérifier si ça ne marche toujours pas

1. **L'URL exacte** : Est-ce que l'URL dans la barre d'adresse est bien `https://ollync.app` (pas `www.ollync.app`) ?

2. **Les cookies/localStorage** : Videz le cache et les cookies du navigateur mobile, puis réessayez

3. **Le réseau** : Testez avec un autre réseau (WiFi vs données mobiles)

4. **Un autre navigateur** : Testez avec Safari ET Chrome sur mobile

## 📝 Notes

Si vous obtenez une erreur spécifique, notez-la pour que je puisse vous aider à la résoudre.
