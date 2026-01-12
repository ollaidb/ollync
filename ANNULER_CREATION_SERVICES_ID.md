# ⚠️ Annuler la création - Utiliser le Services ID existant

## 🚫 Erreur actuelle

Vous êtes en train de créer un NOUVEAU Services ID et vous avez mis l'URL Supabase dans le champ "Identifier", ce qui cause l'erreur "Invalid identifier".

- ❌ L'URL Supabase ne va PAS dans le champ "Identifier"
- ❌ Vous n'avez PAS besoin de créer un nouveau Services ID

## ✅ Solution : Annuler et utiliser celui qui existe

### 1. Annuler la création

1. Sur la page actuelle, cliquez sur le bouton **"Back"** (en bleu, à droite)
2. Cela vous ramènera à la liste des Identifiers

### 2. Utiliser le Services ID existant

1. Dans la liste des Identifiers, trouvez **"Ollync web"** (le Services ID `com.ollync.web`)
2. **Cliquez sur "Ollync web"**

### 3. Configurer les URLs (pas créer un nouveau)

Une fois sur la page du Services ID `com.ollync.web` :

1. Vous verrez "Sign In with Apple" avec une case cochée
2. À droite, il y a un bouton **"Configure"**
3. **Cliquez sur "Configure"** (ce bouton est sur le Services ID, pas pour en créer un nouveau)

### 4. Dans la fenêtre qui s'ouvre

Quand vous cliquez sur "Configure", une fenêtre s'ouvre où vous configurez :

- **Primary App ID** : Sélectionnez `Ollync Mobile`
- **Domains and Subdomains** : `ollync.app`
- **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
  - ⚠️ C'est ICI que vous mettez l'URL Supabase, pas dans "Identifier" !

## 📋 Résumé

1. ✅ Cliquez sur **"Back"** pour annuler
2. ✅ Retournez sur le Services ID existant **"Ollync web"**
3. ✅ Cliquez sur **"Configure"** (pas créer un nouveau)
4. ✅ Dans la fenêtre "Configure", mettez l'URL Supabase dans "Return URLs"

Cliquez sur "Back" maintenant pour annuler la création !
