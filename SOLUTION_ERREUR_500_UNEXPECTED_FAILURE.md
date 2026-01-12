# 🔧 Solution : Erreur 500 "unexpected_failure"

## 🎯 Le Problème

Vous obtenez cette erreur lors de la connexion Apple :
```json
{"code":500,"error_code":"unexpected_failure"}
```

Cette erreur est **générique** - elle masque l'erreur réelle qui se produit côté serveur Supabase.

## 🔍 Causes Possibles

Étant donné que vous utilisez le **même email** pour email/password (ou Google) et Apple, l'erreur 500 pourrait être causée par :

1. **Le trigger `handle_new_user` qui échoue**
   - Peut-être un problème avec `ON CONFLICT` quand un profil existe déjà
   - Peut-être une contrainte unique violée

2. **Conflit d'email dans la table `profiles`**
   - Si la table `profiles` a une contrainte unique sur `email`
   - Et qu'un profil existe déjà avec cet email

3. **Configuration Supabase pour lier les comptes**
   - Supabase essaie de créer un nouveau compte au lieu de lier
   - Et le processus échoue

4. **Credentials Apple incorrects**
   - Secret Key mal formatée
   - Key ID ou Team ID incorrect

## ✅ Solution 1 : Vérifier les Logs Supabase (PRIORITÉ)

**C'est la première chose à faire** pour identifier la cause exacte :

1. **Logs** → **Auth**
2. Testez la connexion Apple
3. Regardez l'erreur exacte dans les logs
4. Copiez le message d'erreur complet

## ✅ Solution 2 : Vérifier si un Profil Existe Déjà avec l'Email

Exécutez cette requête SQL :

```sql
-- Remplacez par votre email réel
SELECT 
  p.id,
  p.email,
  p.full_name,
  au.id as user_id,
  au.raw_app_meta_data->>'provider' as provider
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'votre@email.com';
```

Si un profil existe déjà, cela pourrait causer un conflit.

## ✅ Solution 3 : Vérifier le Trigger

Vérifiez que le trigger gère bien les conflits :

```sql
-- Voir la fonction du trigger
SELECT 
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';
```

Le trigger devrait avoir `ON CONFLICT (id) DO UPDATE SET ...` pour gérer les cas où un profil existe déjà.

## ✅ Solution 4 : Vérifier les Contraintes de la Table Profiles

Vérifiez s'il y a une contrainte unique sur `email` :

```sql
-- Vérifier les contraintes sur la table profiles
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'profiles'
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE';
```

Si `email` a une contrainte unique, cela pourrait causer un conflit.

## 🚨 Action Immédiate

1. **Vérifiez les Logs Supabase** (Logs → Auth) et copiez l'erreur exacte
2. **Exécutez les requêtes SQL** ci-dessus pour vérifier votre situation
3. **Donnez-moi ces informations** pour que je puisse identifier la cause exacte

**Sans les logs Supabase, je ne peux pas identifier la cause précise !**
