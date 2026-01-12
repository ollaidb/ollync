# 🔍 Pourquoi Google Marche et Apple Ne Marche Pas

## ✅ Ce Que Nous Savons

- ✅ **Google fonctionne** : Utilisateur créé dans `auth.users`, profil créé dans `profiles`
- ❌ **Apple ne fonctionne pas** : Erreur 500 "unexpected_failure", rien n'est enregistré
- ✅ **Code identique** : Google et Apple utilisent le même code (`signInWithOAuth`)
- ✅ **Configuration OK** : Vous pouvez aller jusqu'au bout avec Apple (pas de problème API)

## 🎯 Conclusion

Le code frontend est identique. Le problème vient du **callback Supabase** qui échoue pour Apple mais pas pour Google.

## 🔍 Causes Possibles

### 1. Configuration Apple dans Supabase

Même si vous pouvez aller jusqu'au bout, l'erreur 500 au callback suggère que :
- **Secret Key mal formatée** (le plus probable)
- **Key ID ou Team ID incorrect**
- **Services ID incorrect**

### 2. Différence dans les Métadonnées

Apple peut envoyer des métadonnées différentes de Google :
- Email peut être un email relais (`xxxx@privaterelay.appleid.com`)
- Pas d'avatar par défaut
- Nom peut être NULL

Mais le trigger `handle_new_user` gère ces cas avec `COALESCE` et `NULL`, donc ce n'est probablement pas ça.

### 3. Erreur 500 au Callback

L'erreur 500 se produit **avant** même que le trigger ne s'exécute. Cela signifie que :
- Supabase ne peut pas valider les credentials Apple
- Supabase ne peut pas créer l'utilisateur dans `auth.users`
- Le callback échoue avant d'arriver au trigger

## ✅ Solution : Vérifier la Configuration Apple

Même si vous pouvez "aller jusqu'au bout", l'erreur 500 au callback suggère que les **credentials Apple dans Supabase sont incorrects**.

### Action Immédiate

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Apple**
2. Vérifiez que :
   - **Services ID** est correct (`com.ollync.web`)
   - **Secret Key** est le contenu COMPLET du fichier .p8 (avec BEGIN/END)
   - **Key ID** est correct (10 caractères)
   - **Team ID** est correct (10 caractères)

### Script de Comparaison

Exécutez le script `supabase/comparer_google_vs_apple.sql` pour voir :
- Combien d'utilisateurs Google vs Apple
- Les différences dans les métadonnées
- Si des utilisateurs Apple existent (même en erreur)

## 🚨 Pourquoi Google Marche et Apple Ne Marche Pas

La seule différence entre Google et Apple dans votre cas est :
- **Configuration Supabase** : Les credentials Google sont corrects, les credentials Apple sont incorrects

Même si Apple vous laisse "aller jusqu'au bout", quand Supabase essaie de valider les credentials Apple au callback, ça échoue avec une erreur 500.

## 📋 Prochaines Étapes

1. **Vérifier les logs Supabase** (Logs → Auth) pour voir l'erreur exacte
2. **Vérifier la configuration Apple** dans Supabase
3. **Exécuter le script de comparaison** pour voir les différences
4. **Corriger la Secret Key** si nécessaire (contenu complet du fichier .p8)

Le problème vient presque certainement de la **Secret Key mal formatée** dans Supabase pour Apple.
