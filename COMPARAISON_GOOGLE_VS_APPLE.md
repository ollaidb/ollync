# 🔍 Comparaison : Google (✅ Fonctionne) vs Apple (❌ Ne Fonctionne Pas)

## 🎯 Le Problème

- ✅ **Google** : Fonctionne - utilisateur créé, profil créé
- ❌ **Apple** : Ne fonctionne pas - rien n'est enregistré dans la base de données
- ✅ **Configuration Apple** : OK (vous pouvez aller jusqu'au bout)
- ❌ **Résultat** : Pas d'enregistrement dans la base de données

## 📋 Différences à Vérifier

### 1. Code Frontend (Login/Register)

Les deux utilisent `signInWithOAuth`, donc le code devrait être identique.

### 2. Métadonnées Utilisateur

**Google** envoie :
- `full_name` ou `name`
- `avatar_url` ou `picture`
- `email`

**Apple** peut envoyer :
- `full_name` ou `name` (parfois vide si l'utilisateur masque)
- Pas d'avatar par défaut
- Email peut être un email relais (`xxxx@privaterelay.appleid.com`)

### 3. Trigger/Function

Le trigger `handle_new_user` devrait fonctionner pour les deux, MAIS :
- Peut-être une erreur avec les données Apple (NULL, format différent)
- Peut-être une contrainte qui échoue pour Apple

## 🔍 Diagnostic : Comparer les Utilisateurs Google vs Apple

Exécutez ces requêtes SQL pour comparer :

```sql
-- 1. Voir les utilisateurs Google (qui fonctionnent)
SELECT 
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  raw_user_meta_data->>'picture' as picture,
  raw_user_meta_data as all_metadata
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'google'
ORDER BY created_at DESC
LIMIT 3;

-- 2. Voir si des utilisateurs Apple existent (même en erreur)
SELECT 
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data as all_metadata
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Comparer les profils
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  au.raw_app_meta_data->>'provider' as provider
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE au.raw_app_meta_data->>'provider' IN ('google', 'apple')
ORDER BY p.created_at DESC;
```

## 🔍 Vérifier le Trigger pour les Données Apple

Le trigger pourrait échouer si les données Apple sont différentes.

Vérifiez la fonction du trigger :

```sql
-- Voir la fonction handle_new_user
SELECT 
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';
```
