# Guide de Résolution - Session OAuth qui Disparaît

## 🔍 Problèmes Identifiés

1. **Google OAuth** : Le profil se crée mais la session ne persiste pas après rechargement
2. **Apple OAuth** : Rien ne se passe - aucune connexion

## 🔧 Solutions Apportées

### 1. Gestion du Callback OAuth dans Home.tsx

Ajout d'un `useEffect` qui :
- Détecte le callback OAuth (hash `#access_token` ou paramètre `code`)
- Récupère la session automatiquement
- Nettoie l'URL après traitement

### 2. Amélioration des Logs dans useAuth

Ajout de logs pour suivre :
- Les événements d'authentification (`SIGNED_IN`, `SIGNED_OUT`, etc.)
- La récupération de session
- La création de profil

## 📋 Vérifications à Faire

### Pour Google OAuth

1. **Vérifier dans Supabase Dashboard** :
   - Authentication → Providers → Google
   - Vérifier que Google est **activé**
   - Vérifier que Client ID et Client Secret sont corrects

2. **Vérifier dans Google Cloud Console** :
   - APIs & Services → Credentials
   - Vérifier que les **Authorized redirect URIs** incluent :
     - `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
     - `http://localhost:3000` (ou votre port local)

3. **Vérifier la Console du Navigateur** :
   - Ouvrez F12 → Console
   - Connectez-vous avec Google
   - Regardez les logs :
     - `🔐 Détection callback OAuth` - Le callback est détecté
     - `✅ Session OAuth récupérée` - La session est récupérée
     - `✅ Utilisateur authentifié` - L'utilisateur est connecté

### Pour Apple OAuth

1. **Vérifier dans Supabase Dashboard** :
   - Authentication → Providers → Apple
   - Vérifier que Apple est **activé**
   - Vérifier que les identifiants sont configurés

2. **Si Apple n'est pas configuré** :
   - Apple OAuth nécessite une configuration spécifique
   - Vous devez avoir un compte Apple Developer
   - Configuration dans Apple Developer Portal

3. **Vérifier la Console du Navigateur** :
   - Regardez les erreurs lors du clic sur "Se connecter avec Apple"
   - Vérifiez si le provider est activé

## 🧪 Tests

### Test 1 : Google OAuth avec Logs

1. Ouvrez la console du navigateur (F12)
2. Allez sur `/auth/login`
3. Cliquez sur "Se connecter avec Google"
4. Autorisez l'application
5. Regardez les logs dans la console :
   - `🔐 Détection callback OAuth`
   - `✅ Session OAuth récupérée`
   - `✅ Utilisateur authentifié`
   - `🔍 Vérification du profil`
   - `✅ Profil créé avec succès` (si le profil n'existait pas)

6. **Rechargez la page** (F5)
7. Vérifiez que vous restez connecté
8. Vérifiez les logs :
   - `🔄 Événement d'authentification: TOKEN_REFRESHED`
   - `✅ Profil existe déjà`

### Test 2 : Vérifier la Session dans localStorage

1. Après connexion Google, ouvrez la console
2. Tapez : `localStorage.getItem('sb-abmtxvyycslskmnmlniq-auth-token')`
3. Vous devriez voir un token JSON

4. Rechargez la page
5. Retapez la commande
6. Le token devrait toujours être présent

### Test 3 : Apple OAuth

1. Vérifiez d'abord si Apple est activé dans Supabase
2. Si oui, testez la connexion
3. Si non, configurez Apple OAuth d'abord

## ❓ Questions à Vérifier

1. **Le provider Google est-il activé dans Supabase ?**
   - Dashboard → Authentication → Providers → Google
   - Le toggle doit être **activé**

2. **Les URLs de redirection sont-elles correctes ?**
   - Dans Google Cloud Console
   - Doit inclure l'URL de callback Supabase

3. **La session est-elle stockée dans localStorage ?**
   - Ouvrez DevTools → Application → Local Storage
   - Cherchez les clés commençant par `sb-`

4. **Y a-t-il des erreurs dans la console ?**
   - Regardez les erreurs JavaScript
   - Regardez les erreurs réseau (onglet Network)

## 🆘 Si le Problème Persiste

### Pour Google

1. **Déconnectez-vous complètement** :
   - Ouvrez DevTools → Application → Local Storage
   - Supprimez toutes les clés `sb-*`
   - Reconnectez-vous

2. **Vérifiez les cookies** :
   - Certains navigateurs bloquent les cookies tiers
   - Vérifiez les paramètres de confidentialité

3. **Testez dans un navigateur en navigation privée** :
   - Pour éviter les problèmes de cache

### Pour Apple

1. **Vérifiez la configuration Apple** :
   - Apple OAuth nécessite une configuration spécifique
   - Consultez le guide `GUIDE_AUTHENTIFICATION_APPLE.md`

2. **Vérifiez les logs Supabase** :
   - Dashboard → Logs → Postgres Logs
   - Cherchez les erreurs liées à Apple

## 📝 Notes

- Le callback OAuth devrait être géré automatiquement par Supabase avec `detectSessionInUrl: true`
- Le code ajouté dans `Home.tsx` est une sécurité supplémentaire
- Les logs vous aideront à identifier où le problème se situe

