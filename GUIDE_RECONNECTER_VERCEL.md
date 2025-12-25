# Guide : Reconnecter votre Projet à Vercel après Suppression d'Ancien Domaine

Ce guide vous explique comment reconnecter votre projet GitHub à Vercel après avoir supprimé l'ancien domaine.

## 📋 Situation Actuelle

Vous avez supprimé l'ancien domaine lié à votre projet Vercel, et maintenant :
- Le lien GitHub ne fonctionne plus
- Le projet n'est plus accessible via Vercel
- Vous devez reconnecter le projet avec le nouveau domaine `ollync.app`

## 🔧 Solution : Reconnecter le Projet à Vercel

### Option 1 : Si le Projet Vercel Existe Encore (Recommandé)

Si votre projet existe toujours dans Vercel (juste sans domaine) :

1. **Connectez-vous à [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Vérifiez si votre projet `ollync` existe toujours** :
   - Si oui, passez à l'étape 3
   - Si non, passez à l'Option 2

3. **Dans votre projet Vercel** :
   - Allez dans **Settings** > **Git**
   - Vérifiez que la connexion GitHub est toujours active
   - Si ce n'est pas le cas, cliquez sur **Connect Git Repository**
   - Sélectionnez votre repository GitHub : `ollaidb/ollync`

4. **Ajoutez le nouveau domaine** :
   - Allez dans **Settings** > **Domains**
   - Cliquez sur **Add Domain**
   - Entrez : `ollync.app`
   - Suivez les instructions pour configurer le DNS

5. **Déclenchez un nouveau déploiement** :
   - Allez dans l'onglet **Deployments**
   - Cliquez sur les trois points (...) à côté du dernier déploiement
   - Sélectionnez **Redeploy**
   - OU faites un commit vide et poussez-le sur GitHub :
     ```bash
     git commit --allow-empty -m "Trigger redeploy"
     git push
     ```

### Option 2 : Créer un Nouveau Projet Vercel

Si votre projet n'existe plus dans Vercel :

1. **Connectez-vous à [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Cliquez sur "Add New..." > "Project"**

3. **Importez votre repository GitHub** :
   - Sélectionnez votre repository : `ollaidb/ollync`
   - Cliquez sur **Import**

4. **Configurez le projet** :
   - **Framework Preset** : Vite (devrait être détecté automatiquement)
   - **Root Directory** : `./` (racine)
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

5. **Variables d'environnement** :
   - Si vous aviez des variables d'environnement, ajoutez-les maintenant
   - Allez dans **Settings** > **Environment Variables**
   - Ajoutez toutes les variables nécessaires (ex: clés API, URLs Supabase, etc.)

6. **Déployez** :
   - Cliquez sur **Deploy**
   - Attendez que le déploiement se termine

7. **Ajoutez le domaine** :
   - Une fois le déploiement réussi, allez dans **Settings** > **Domains**
   - Cliquez sur **Add Domain**
   - Entrez : `ollync.app`
   - Suivez les instructions pour configurer le DNS

## 🔧 Configuration du DNS pour ollync.app

Après avoir ajouté le domaine dans Vercel :

1. **Vercel vous donnera l'enregistrement DNS à configurer** :
   ```
   Type: A
   Name: @
   Value: 216.198.79.1
   ```

2. **Configurez le DNS chez votre registrar** :
   - Connectez-vous à votre registrar (où vous avez acheté ollync.app)
   - Allez dans la gestion DNS
   - Ajoutez/modifiez l'enregistrement A :
     - Type: A
     - Name: @ (ou laissez vide)
     - Value: 216.198.79.1
   - Sauvegardez

3. **Vérifiez la propagation** :
   - Attendez 5-15 minutes
   - Vérifiez avec : `dig ollync.app +short` (devrait retourner `216.198.79.1`)
   - Dans Vercel, cliquez sur **Refresh** à côté du domaine

4. **Le statut devrait passer à "Valid"** ✅

## 📝 Variables d'Environnement à Vérifier

Si vous créez un nouveau projet, assurez-vous d'ajouter toutes les variables d'environnement nécessaires :

### Variables Supabase (si utilisées)
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé publique Supabase

### Variables Google (si utilisées)
- `VITE_GOOGLE_MAPS_API_KEY` : Clé API Google Maps

### Autres variables spécifiques à votre projet

Pour ajouter ces variables :
1. Allez dans **Settings** > **Environment Variables**
2. Cliquez sur **Add New**
3. Ajoutez chaque variable avec sa valeur
4. Sélectionnez les environnements (Production, Preview, Development)

## ✅ Vérification Finale

1. **Vérifiez que le déploiement est réussi** :
   - Onglet **Deployments** dans Vercel
   - Le dernier déploiement doit être vert ✅

2. **Vérifiez que le domaine est configuré** :
   - **Settings** > **Domains**
   - Le domaine `ollync.app` doit avoir le statut **Valid** ✅

3. **Testez l'accès au site** :
   - Visitez `https://ollync.app` dans votre navigateur
   - Le site devrait s'afficher correctement
   - Vérifiez le cadenas vert (HTTPS)

## 🆘 Dépannage

### Le projet ne se déploie pas

1. **Vérifiez les logs de déploiement** :
   - Allez dans **Deployments**
   - Cliquez sur le déploiement en échec
   - Consultez les logs pour identifier l'erreur

2. **Vérifiez la configuration** :
   - **Settings** > **Build and Development Settings**
   - Vérifiez que :
     - Build Command : `npm run build`
     - Output Directory : `dist`
     - Install Command : `npm install`

3. **Vérifiez que le code est bien poussé sur GitHub** :
   ```bash
   git status
   git push
   ```

### Le domaine reste en "Invalid Configuration"

1. **Vérifiez le DNS** :
   ```bash
   dig ollync.app +short
   # Devrait retourner : 216.198.79.1
   ```

2. **Si ce n'est pas la bonne IP** :
   - Allez chez votre registrar
   - Modifiez l'enregistrement A pour pointer vers `216.198.79.1`
   - Attendez la propagation (5-15 minutes)

3. **Cliquez sur Refresh dans Vercel**

### Les variables d'environnement ne fonctionnent pas

1. **Vérifiez que les variables sont bien ajoutées** :
   - **Settings** > **Environment Variables**
   - Assurez-vous qu'elles sont présentes

2. **Vérifiez les environnements** :
   - Les variables doivent être activées pour "Production"

3. **Redéployez après avoir ajouté des variables** :
   - Faites un nouveau déploiement pour que les variables soient prises en compte

## 📚 Ressources

- [Documentation Vercel - Ajouter un domaine](https://vercel.com/docs/concepts/projects/domains)
- [Documentation Vercel - Variables d'environnement](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Vercel - Importer un projet](https://vercel.com/docs/concepts/deployments/overview)

