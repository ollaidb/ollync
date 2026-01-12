# Configurer les URLs dans Apple Developer Portal

## Action Directe

1. **Cliquez sur le bouton bleu "Configure"** à côté de "Sign In with Apple"

2. **Une fenêtre/modal s'ouvre** avec les champs suivants :

   - **Primary App ID** : Sélectionnez votre App ID (ex: `Ollync Mobile`)

   - **Website URLs** :
     - **Domains and Subdomains** : Entrez `ollync.app`
     - **Return URLs** : Entrez `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

3. **Cliquez sur "Save"** dans cette fenêtre

4. **Retournez sur la page principale** et cliquez sur **"Continue"**

## Si la Fenêtre "Configure" Ne S'Ouvre Pas

- Videz le cache du navigateur (Cmd+Shift+R ou Ctrl+Shift+R)
- Essayez un autre navigateur
- Vérifiez que JavaScript est activé

## Si Vous Ne Voyez Pas les Champs URL

- Assurez-vous d'avoir cliqué sur "Configure" (pas juste activé la case)
- La fenêtre devrait avoir deux sections : "Primary App ID" et "Website URLs"
