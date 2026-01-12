# 📋 Copier le JWT dans Supabase - Instructions Simples

## ✅ Vous N'Avez Pas Besoin de Nouvelles Clés

Le JWT est **déjà généré** et prêt à être utilisé. Vous n'avez qu'à le copier dans Supabase.

## 📋 Ce Que Vous Devez Faire

### 1. Copiez ce JWT (tout le texte ci-dessous) :

```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkNONjM0NU00NFQifQ.eyJpc3MiOiJXUjU3MjREQ0FOIiwiaWF0IjoxNzY4MTg4MDYwLCJleHAiOjE3ODM3NDAwNjAsImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20ub2xseW5jLndlYiJ9.GoMkQm60vpZR5tz--yPMHePlbJyO0p96XSAjzsUNf1B7hm_PqmfymO0lgc9G2JZXojmfWSEtLhAqE3_n9LHcpA
```

### 2. Dans Supabase :

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers** → **Apple**
3. Trouvez le champ **"Secret Key (for OAuth)"**
4. **Sélectionnez tout le contenu actuel** (Cmd+A ou Ctrl+A)
5. **Supprimez** (Delete ou Backspace)
6. **Collez le JWT ci-dessus** (Cmd+V ou Ctrl+V)
7. Cliquez sur **"Save"** (en bas à droite)

## ✅ C'est Tout !

- ❌ **Vous n'avez PAS besoin de créer de nouvelles clés**
- ❌ **Vous n'avez PAS besoin de télécharger quoi que ce soit**
- ✅ **Vous avez juste besoin de copier le JWT ci-dessus**

## 🔍 Vérification

Après avoir sauvegardé, le message d'erreur rouge **"Secret key should be a JWT"** devrait disparaître.

Ensuite, **testez la connexion Apple** !

## ❓ Résumé

**Question** : "Je mets quel nouveau clés ?"

**Réponse** : **Aucune nouvelle clé !** Vous copiez juste le **JWT** (le long texte qui commence par `eyJhbGci...`) dans le champ "Secret Key" de Supabase.

**C'est tout ce qu'il y a à faire !**
