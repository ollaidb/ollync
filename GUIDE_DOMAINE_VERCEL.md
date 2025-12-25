# Guide de Configuration du Domaine Personnalisé ollync.app avec Vercel

Ce guide vous explique comment configurer votre domaine personnalisé **ollync.app** avec Vercel.

## 📋 Prérequis

- Un projet déployé sur Vercel
- Le domaine **ollync.app** acheté et configurable
- Accès à votre registrar de domaine (là où vous avez acheté ollync.app)

## 🔧 Étape 1 : Ajouter le Domaine dans Vercel

### 1.1 Accéder aux paramètres du projet

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **ollync**
3. Allez dans l'onglet **Settings** (Paramètres)
4. Cliquez sur **Domains** dans le menu de gauche

### 1.2 Ajouter le domaine

1. Dans le champ "Add Domain", entrez : `ollync.app`
2. Cliquez sur **Add** ou **Add Domain**

## 🔧 Étape 2 : Configuration DNS chez votre Registrar

Vercel affiche actuellement **"Invalid Configuration"** pour votre domaine. Pour résoudre cela, vous devez configurer un enregistrement DNS chez votre registrar.

### ⚠️ Important : Enregistrement DNS Requis

Vercel nécessite l'ajout d'un enregistrement DNS de type **A** avec les valeurs suivantes :

```
Type: A
Name: @
Value: 216.198.79.1
```

### Instructions détaillées :

1. **Connectez-vous à votre registrar** (le service où vous avez acheté ollync.app)
   - Exemples de registrars : Namecheap, GoDaddy, Google Domains, Cloudflare, etc.

2. **Trouvez la section DNS** de votre domaine
   - Cherchez "DNS Management", "DNS Settings", "Gestion DNS", ou "Zone DNS"

3. **Ajoutez un nouvel enregistrement A** :
   - **Type d'enregistrement** : Sélectionnez **A** (ou **A Record**)
   - **Nom / Host / Name** : Entrez **@** (ou laissez vide selon votre registrar)
     - Le symbole @ représente le domaine racine (ollync.app)
   - **Valeur / Target / Points to / Address** : Entrez **216.198.79.1**
   - **TTL** : Laissez la valeur par défaut (généralement 3600 ou Auto)

4. **Sauvegardez les modifications**

### 📝 Notes importantes :

- ⏱️ **Propagation DNS** : Les modifications DNS peuvent prendre de **quelques minutes à 48 heures** pour se propager
- 🔄 **Vérification automatique** : Vercel vérifie automatiquement la configuration toutes les quelques minutes
- 🔍 **Bouton Refresh** : Vous pouvez cliquer sur le bouton **"Refresh"** dans Vercel pour forcer une vérification

## 🔧 Étape 3 : Vérification et Activation

1. **Après avoir configuré le DNS** chez votre registrar, revenez sur la page Vercel
2. **Attendez quelques minutes** pour que la propagation DNS commence
3. **Cliquez sur le bouton "Refresh"** à côté de votre domaine pour forcer une vérification
4. Vercel vérifiera automatiquement la configuration
5. Une fois vérifié, le statut passera de **"Invalid Configuration"** à **"Valid"** ✅
6. Votre site sera alors accessible sur `https://ollync.app`

### Comment savoir si c'est configuré correctement ?

- ✅ Le statut dans Vercel passera de "Invalid Configuration" à "Valid"
- ✅ L'icône d'alerte rouge disparaîtra
- ✅ Vous pourrez visiter `https://ollync.app` dans votre navigateur

## 🔧 Étape 4 : Configuration SSL (Automatique)

Vercel configure automatiquement un certificat SSL gratuit pour votre domaine :
- Le certificat SSL sera automatiquement généré
- Votre site sera accessible en HTTPS : `https://ollync.app`
- Le certificat sera automatiquement renouvelé

## 🔧 Étape 5 : Mettre à jour les Configurations de l'Application

Une fois le domaine configuré, vous devrez mettre à jour certaines configurations :

### 5.1 Mise à jour de l'authentification Google (si applicable)

Si vous utilisez l'authentification Google OAuth :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans **APIs & Services** > **Credentials**
3. Modifiez votre OAuth client ID
4. Ajoutez dans **Authorized JavaScript origins** :
   ```
   https://ollync.app
   ```
5. Ajoutez dans **Authorized redirect URIs** (si nécessaire) :
   ```
   https://ollync.app/auth/callback
   ```

### 5.2 Mise à jour de Supabase (si applicable)

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **URL Configuration**
4. Ajoutez `https://ollync.app` dans les **Redirect URLs**
5. Ajoutez `https://ollync.app` dans les **Site URL** si nécessaire

### 5.3 Mise à jour des variables d'environnement (si nécessaire)

Si vous avez des variables d'environnement dans Vercel qui référencent l'ancien domaine :

1. Allez dans **Settings** > **Environment Variables**
2. Mettez à jour toutes les variables qui contiennent l'ancien domaine
3. Redéployez votre application

## ⚠️ Points Importants

- **Propagation DNS** : La propagation DNS peut prendre entre quelques minutes et 48 heures
- **HTTPS automatique** : Vercel configure automatiquement HTTPS, aucun certificat à installer manuellement
- **WWW ou sans WWW** : Vous pouvez configurer les deux variantes (`ollync.app` et `www.ollync.app`) si vous le souhaitez
- **Redirections** : Vercel peut automatiquement rediriger `www.ollync.app` vers `ollync.app` (ou inversement)

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. Visitez `https://ollync.app` dans votre navigateur
2. Vérifiez que le cadenas vert (HTTPS) s'affiche
3. Testez toutes les fonctionnalités de votre application (authentification, API, etc.)

## 📝 Notes Finales

- Votre ancien domaine Vercel (ex: `votre-projet.vercel.app`) continuera de fonctionner
- Vous pouvez avoir plusieurs domaines pointant vers le même projet
- Vercel gère automatiquement les redirections HTTP vers HTTPS

## 🆘 Dépannage

### Le domaine reste en "Invalid Configuration"

1. **Vérifiez l'enregistrement DNS** :
   - Utilisez un outil comme [whatsmydns.net](https://www.whatsmydns.net/)
   - Recherchez le domaine `ollync.app` et vérifiez que l'enregistrement A pointe vers `216.198.79.1`
   - Vous pouvez aussi utiliser la commande : `dig ollync.app` ou `nslookup ollync.app`

2. **Vérifiez la configuration chez votre registrar** :
   - Assurez-vous que l'enregistrement A est bien créé avec :
     - Type: A
     - Name: @ (ou vide)
     - Value: 216.198.79.1
   - Vérifiez qu'il n'y a pas de conflit avec d'autres enregistrements

3. **Attendez la propagation** :
   - La propagation DNS peut prendre jusqu'à 48 heures
   - Essayez de cliquer sur "Refresh" dans Vercel toutes les heures

4. **Contactez votre registrar** :
   - Si après 24-48h cela ne fonctionne toujours pas, contactez le support de votre registrar
   - Vérifiez que votre domaine n'a pas de restrictions spéciales

5. **Contactez le support Vercel** :
   - Si tout semble correct mais que Vercel ne détecte toujours pas la configuration, contactez le [support Vercel](https://vercel.com/support)

