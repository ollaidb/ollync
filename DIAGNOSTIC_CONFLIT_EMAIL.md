# 🔍 Diagnostic : Conflit d'Email avec Apple OAuth

## 🎯 Votre Situation

- Vous avez un compte avec **email/password** (ou Google) avec votre email
- Vous essayez de vous connecter avec **Apple** en utilisant le **même email**
- Vous obtenez une **erreur 500**

## ✅ Comportement Normal

Supabase devrait **lier automatiquement les comptes** quand le même email est utilisé avec différentes méthodes d'authentification.

Mais si vous obtenez une erreur 500, c'est qu'il y a un problème.

## 🔍 Diagnostic : Vérifier Votre Situation

### Étape 1 : Vérifier si Votre Email Existe Déjà

Exécutez cette requête SQL dans **Supabase SQL Editor** :

```sql
-- Remplacez 'votre@email.com' par votre email réel
SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN raw_app_meta_data->>'provider' IS NULL THEN 'email/password'
    ELSE raw_app_meta_data->>'provider'
  END as auth_method
FROM auth.users
WHERE email = 'votre@email.com'
ORDER BY created_at;
```

**Résultats possibles :**

1. **Un compte avec "email/password"** → Le problème vient du conflit
2. **Un compte avec "google"** → Le problème vient du conflit
3. **Aucun compte** → Le problème vient d'ailleurs (configuration Apple)
4. **Plusieurs comptes** → Il y a un problème de gestion des comptes

### Étape 2 : Vérifier les Logs Supabase

1. **Logs** → **Auth**
2. Testez la connexion Apple
3. Regardez l'erreur exacte

**Erreurs possibles :**
- "duplicate key value" → Conflit de clé unique
- "unexpected_failure" → Erreur générale (peut être le conflit)
- Autre ?

### Étape 3 : Vérifier le Trigger

Le trigger `on_auth_user_created` pourrait échouer si un profil existe déjà.

```sql
-- Vérifier si le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

## 🔧 Solutions

### Solution 1 : Si le Compte Email Existe Déjà

Si vous avez un compte avec email/password, Supabase devrait normalement lier les comptes automatiquement.

**Si ça ne fonctionne pas**, cela peut être dû à :

1. **Configuration Supabase** : L'account linking n'est pas activé (peu probable, c'est par défaut)
2. **Trigger qui échoue** : Le trigger `on_auth_user_created` échoue lors de la création du profil
3. **Contrainte unique** : Un problème de contrainte dans la table `profiles`

### Solution 2 : Vérifier le Trigger pour les Conflits

Le trigger pourrait essayer de créer un profil alors qu'un profil existe déjà avec le même email.

**Vérifiez le trigger** :

```sql
-- Voir la fonction du trigger
SELECT 
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';
```

Le trigger devrait gérer le cas où un profil existe déjà (ON CONFLICT DO NOTHING ou similaire).

### Solution 3 : Tester avec un Email Différent (Temporaire)

Pour isoler le problème :

1. Créez un compte Apple ID avec un **email différent** (temporairement)
2. Testez la connexion Apple avec ce nouvel email
3. Si ça fonctionne → Le problème vient du conflit avec l'email existant
4. Si ça ne fonctionne pas → Le problème est ailleurs (configuration Apple)

## 📋 Informations à Me Fournir

1. **Résultat de la requête SQL** : Combien de comptes avez-vous avec votre email ?
2. **Méthode d'authentification initiale** : Comment vous êtes-vous inscrit la première fois ? (email/password, Google, autre ?)
3. **Message d'erreur exact dans les logs Supabase** (Logs → Auth)
4. **Test avec un email différent** : Si vous testez avec un autre email Apple, est-ce que ça fonctionne ?

Avec ces informations, je pourrai identifier si c'est un problème de conflit d'email ou de configuration Apple !
