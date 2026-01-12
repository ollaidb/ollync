# 🔍 Vérifier les Logs Supabase pour Trouver l'Erreur Exacte

## 📋 Étape 1 : Vérifier les Logs Auth dans Supabase

1. Allez dans **Supabase Dashboard**
2. Dans le menu de gauche, cliquez sur **Logs**
3. Cliquez sur **Auth** (ou **Authentication**)
4. Regardez les logs récents (les dernières 5-10 minutes)

### Ce qu'il faut chercher :

- ❌ Erreurs avec "apple" dans le message
- ❌ Erreurs avec "500" ou "unexpected_failure"
- ❌ Erreurs avec "invalid_client" ou "invalid_client_secret"
- ❌ Erreurs avec "JWT" ou "token"

## 📋 Étape 2 : Tester et Observer les Logs en Temps Réel

1. **Ouvrez les Logs Supabase** (Logs → Auth)
2. **Filtrez** sur "error" ou "apple"
3. **Laissez la page ouverte**
4. Dans un autre onglet, **testez la connexion Apple**
5. **Retournez immédiatement aux logs**
6. **Copiez le message d'erreur exact** qui apparaît

## 📋 Étape 3 : Vérifier la Configuration Actuelle

Ensuite, vérifiez dans Supabase Dashboard → Authentication → Providers → Apple :

1. **Apple est-il activé ?** (toggle ON/OFF)
2. **Services ID** : Quelle valeur exacte ?
3. **Secret Key** : Est-ce que le champ est rempli ? (masqué avec des points)
4. **Key ID** : Quelle valeur exacte ?
5. **Team ID** : Quelle valeur exacte ?

## 🔍 Erreurs Courantes et Solutions

### Erreur : "invalid_client" ou "invalid_client_secret"
- **Cause** : Secret Key incorrect ou Key ID/Team ID incorrect
- **Solution** : Vérifier que la Secret Key est le contenu COMPLET du fichier .p8

### Erreur : "JWT validation failed"
- **Cause** : Format de la Secret Key incorrect
- **Solution** : Doit inclure `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`

### Erreur : "redirect_uri_mismatch"
- **Cause** : URL de callback incorrecte dans Apple Developer Portal
- **Solution** : Vérifier que la Return URL est exactement `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

### Erreur : "unexpected_failure" (erreur 500)
- **Cause** : Généralement Secret Key mal formatée ou credentials incorrects
- **Solution** : Vérifier tous les champs (Services ID, Key ID, Team ID, Secret Key)

## 📝 Information à Me Fournir

Pour que je puisse vous aider, j'ai besoin de :

1. **Le message d'erreur exact** dans les logs Supabase (Logs → Auth)
2. **Screenshot ou copie** de la configuration Apple dans Supabase (Authentication → Providers → Apple)
3. **Confirmation** : Avez-vous le fichier .p8 de la clé Apple ?
