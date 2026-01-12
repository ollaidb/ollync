# ⚠️ NE PAS créer un nouveau Services ID - Utiliser celui qui existe

## ✅ Vous avez DÉJÀ un Services ID

- Services ID existant : `com.ollync.web` ✓
- Il est déjà créé et configuré ✓

## 🚫 Ne créez PAS un nouveau Services ID

Si vous êtes sur la page "Register a Services ID", cliquez sur **"Back"** pour annuler.

## ✅ Utilisez le Services ID existant

### Retournez sur le Services ID existant

1. Cliquez sur **"Back"** si vous êtes sur la page de création
2. Ou allez dans **Identifiers** → Cherchez **"Ollync web"**
3. Cliquez sur **"Ollync web"** (le Services ID `com.ollync.web`)

### Configurez les URLs sur le Services ID existant

Une fois sur la page du Services ID `com.ollync.web` :

1. Vous verrez "Sign In with Apple" avec une case cochée
2. À droite, il y a un bouton **"Configure"**
3. **Cliquez sur ce bouton "Configure"**

### Quand vous cliquez sur "Configure"

Une fenêtre/modal s'ouvre où vous pouvez configurer :

1. **Primary App ID** : Sélectionnez `Ollync Mobile (WR5724DCAN.com.ollync.mobile)`

2. **Website URLs** :
   - **Domains and Subdomains** : Entrez `ollync.app`
   - **Return URLs** : Entrez `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
     - ⚠️ L'URL doit être EXACTE (sans slash à la fin)

3. Cliquez sur **Save** dans cette fenêtre

4. Retournez sur la page principale et cliquez sur **Continue** pour enregistrer

## 📋 Résumé

- ✅ Services ID existant : `com.ollync.web` (utilisez celui-là)
- 🚫 Ne créez pas un nouveau Services ID
- ✅ Cliquez sur "Configure" à côté de "Sign In with Apple"
- ✅ Configurez les URLs dans la fenêtre qui s'ouvre

Retournez sur le Services ID existant "Ollync web" et cliquez sur "Configure" !
