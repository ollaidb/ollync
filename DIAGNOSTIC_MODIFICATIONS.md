# Diagnostic : mes modifications ne s'affichent pas

## Test rapide à faire MAINTENANT

1. **Ouvrez Cursor** et assurez-vous que le dossier ouvert est bien **`/Users/binta/test ollync`**  
   (Menu Fichier → Ouvrir un dossier)

2. **Ouvrez le terminal** dans Cursor (Ctrl + ` ou Cmd + J)

3. **Exécutez** (depuis la racine du projet) :
   ```bash
   cd /Users/binta/test\ ollync
   npm run dev
   ```

4. **Ouvrez** http://localhost:3000 dans votre navigateur

5. **Regardez l’onglet du navigateur** : le titre doit afficher **"Ollync - Mise en relation ✓"**
   - Si vous voyez le **✓** → le bon code est chargé.
   - Si vous voyez **"Ollync - Mise en relation"** sans ✓ → vous regardez une ancienne version ou un autre projet.

## Causes possibles

| Cause | Solution |
|-------|----------|
| **URL de production** (ex. ollync.vercel.app) | Les changements ne sont que dans votre code local. Utilisez http://localhost:3000 pour tester. |
| **Mauvais dossier ouvert** | Ouvrez le dossier `test ollync` (racine), pas un sous-dossier. |
| **`npm run dev` lancé ailleurs** | Lancez la commande depuis le dossier `test ollync`. |
| **Cache du navigateur** | Faites un rafraîchissement forcé : Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows). |
| **Serveur déjà lancé** | Arrêtez le serveur (Ctrl+C), puis relancez `npm run dev`. |

## Deux emplacements possibles pour le code

Dans votre projet, le code source se trouve dans :

- **`/Users/binta/test ollync/src/`** ← utilisé si vous lancez `npm run dev` depuis la racine
- **`/Users/binta/test ollync/ollync/src/`** ← utilisé si vous lancez `npm run dev` depuis le dossier `ollync`

Les modifications ont été appliquées aux deux emplacements.

## Test de la modale "Enregistrer vos modifications"

1. Allez sur http://localhost:3000/profile/edit
2. Connectez-vous si besoin
3. Modifiez un champ (nom, bio, etc.)
4. Cliquez sur le bouton retour (flèche) en haut à gauche
5. Une modale doit apparaître : « Voulez-vous enregistrer vos modifications avant de quitter ? »
