# 🔧 Guide : Corriger le DNS pour ollync.app

## ⚠️ Problème Identifié

Votre domaine `ollync.app` pointe actuellement vers **213.186.33.5** au lieu de **216.198.79.1** (l'adresse Vercel).

C'est pour cela que le domaine ne fonctionne pas avec votre application.

## 📋 Étape par Étape : Corriger le DNS

### Étape 1 : Identifier votre Registrar

Vous devez savoir chez qui vous avez acheté le domaine `ollync.app`. Les registrars les plus courants sont :
- Namecheap
- GoDaddy
- Google Domains / Google Workspace
- OVH
- Cloudflare
- Gandi
- 1&1 IONOS

**Comment le savoir ?**
- Vérifiez vos emails de confirmation d'achat du domaine
- Regardez vos relevés bancaires (nom du service qui a facturé)
- Connectez-vous aux différents services que vous utilisez pour trouver lequel gère ollync.app

### Étape 2 : Se Connecter à votre Registrar

1. Allez sur le site web de votre registrar
2. Connectez-vous avec votre compte
3. Trouvez la section "Mes domaines" ou "Domaines"

### Étape 3 : Accéder à la Gestion DNS

Une fois dans la gestion de votre domaine `ollync.app`, cherchez :
- "DNS Management" / "Gestion DNS"
- "DNS Settings" / "Paramètres DNS"
- "Zone DNS" / "DNS Zone"
- "Nameservers" / "Serveurs de noms" (mais on veut modifier les enregistrements, pas les nameservers)

### Étape 4 : Modifier l'Enregistrement A

**Ce que vous devez faire :**

1. **Trouvez l'enregistrement A existant** qui pointe vers `213.186.33.5`
2. **Modifiez-le** OU **Supprimez-le et créez-en un nouveau**

**Nouveaux paramètres :**
```
Type: A (ou A Record)
Name/Host: @ (ou laissez vide, ou "ollync.app" selon votre registrar)
Value/Points to/Address: 216.198.79.1
TTL: 3600 (ou Auto/Default)
```

3. **Sauvegardez** les modifications

### Étape 5 : Attendre la Propagation DNS

- **Délai minimum** : 5-15 minutes
- **Délai maximum** : 24-48 heures
- **En général** : 1-2 heures

### Étape 6 : Vérifier la Configuration

**Méthode 1 : Commande Terminal**
```bash
dig ollync.app +short
```
**Résultat attendu :** `216.198.79.1`

**Méthode 2 : Vérifier dans Vercel**
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `ollync`
3. Allez dans **Settings** > **Domains**
4. Cliquez sur le bouton **Refresh** à côté de `ollync.app`
5. Le statut devrait passer de "Invalid Configuration" à **"Valid"** ✅

## 📝 Instructions par Registrar

### Namecheap

1. Connectez-vous à [Namecheap](https://www.namecheap.com/)
2. Allez dans **Domain List**
3. Cliquez sur **Manage** à côté de `ollync.app`
4. Allez dans l'onglet **Advanced DNS**
5. Trouvez l'enregistrement **A Record** avec `213.186.33.5`
6. Cliquez sur l'icône **✏️ (crayon)** pour modifier
7. Changez la valeur pour : `216.198.79.1`
8. Cliquez sur **✓ (checkmark)** pour sauvegarder
9. Attendez quelques minutes

### GoDaddy

1. Connectez-vous à [GoDaddy](https://www.godaddy.com/)
2. Allez dans **My Products** > **Domains**
3. Cliquez sur `ollync.app`
4. Allez dans **DNS** ou **Manage DNS**
5. Trouvez l'enregistrement **A** avec `213.186.33.5`
6. Cliquez sur le **✏️ (crayon)** pour modifier
7. Changez **Points to** pour : `216.198.79.1`
8. Cliquez sur **Save**
9. Attendez quelques minutes

### OVH

1. Connectez-vous à [OVH](https://www.ovh.com/)
2. Allez dans **Domaines** > **Mes domaines**
3. Cliquez sur `ollync.app`
4. Allez dans l'onglet **Zone DNS**
5. Trouvez l'enregistrement **A** avec `213.186.33.5`
6. Cliquez sur **✏️ Modifier**
7. Changez **Cible** pour : `216.198.79.1`
8. Cliquez sur **Valider**
9. Attendez quelques minutes

### Cloudflare

1. Connectez-vous à [Cloudflare](https://www.cloudflare.com/)
2. Sélectionnez votre domaine `ollync.app`
3. Allez dans **DNS** > **Records**
4. Trouvez l'enregistrement **A** avec `213.186.33.5`
5. Cliquez sur **Edit** (✏️)
6. Changez **IPv4 address** pour : `216.198.79.1`
7. Cliquez sur **Save**
8. Attendez quelques minutes

### Google Domains / Google Workspace

1. Connectez-vous à [Google Domains](https://domains.google.com/)
2. Cliquez sur `ollync.app`
3. Allez dans **DNS**
4. Trouvez l'enregistrement **A** avec `213.186.33.5`
5. Cliquez sur **✏️ (Edit)**
6. Changez **Data** pour : `216.198.79.1`
7. Cliquez sur **Save**
8. Attendez quelques minutes

### Gandi

1. Connectez-vous à [Gandi](https://www.gandi.net/)
2. Allez dans **Domaines** > `ollync.app`
3. Allez dans **Zone DNS**
4. Trouvez l'enregistrement **A** avec `213.186.33.5`
5. Cliquez sur **Modifier**
6. Changez la **Valeur** pour : `216.198.79.1`
7. Cliquez sur **Enregistrer**
8. Attendez quelques minutes

## ✅ Vérification Finale

Une fois le DNS corrigé et propagé :

1. **Vérifiez avec dig :**
   ```bash
   dig ollync.app +short
   # Devrait afficher : 216.198.79.1
   ```

2. **Dans Vercel :**
   - Le statut du domaine devrait être **"Valid"** ✅
   - Cliquez sur **Refresh** si nécessaire

3. **Testez dans votre navigateur :**
   - Allez sur `https://ollync.app`
   - Le site devrait s'afficher correctement
   - Le cadenas vert (HTTPS) devrait apparaître

## 🆘 Si ça ne marche toujours pas

### Le DNS ne se propage pas

1. **Videz le cache DNS de votre ordinateur :**
   ```bash
   # Sur macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Sur Windows (dans PowerShell en tant qu'admin)
   ipconfig /flushdns
   
   # Sur Linux
   sudo systemd-resolve --flush-caches
   ```

2. **Testez depuis différents réseaux** (WiFi, 4G, etc.)

3. **Utilisez un outil en ligne** :
   - [whatsmydns.net](https://www.whatsmydns.net/#A/ollync.app)
   - Vérifiez si l'IP `216.198.79.1` apparaît partout dans le monde

### Le DNS est correct mais Vercel affiche toujours "Invalid Configuration"

1. **Attendez 24-48 heures** pour la propagation complète
2. **Vérifiez qu'il n'y a pas d'autres enregistrements en conflit** dans votre zone DNS
3. **Contactez le support Vercel** avec :
   - Une capture d'écran de votre zone DNS
   - Le résultat de `dig ollync.app`

### Le site ne se charge toujours pas

1. **Vérifiez que le déploiement Vercel est réussi** :
   - Onglet **Deployments** dans Vercel
   - Le dernier déploiement doit être vert ✅

2. **Vérifiez les logs Vercel** pour voir s'il y a des erreurs

3. **Testez l'URL Vercel par défaut** :
   - Allez sur `https://votre-projet.vercel.app`
   - Si ça fonctionne, le problème est uniquement lié au domaine personnalisé

## 📞 Besoin d'Aide ?

Si vous ne trouvez pas votre registrar dans la liste ou si vous avez des difficultés, indiquez-moi :
1. Le nom de votre registrar
2. Une capture d'écran de votre page DNS (en masquant les informations sensibles)
3. Le message d'erreur que vous obtenez

Je pourrai vous aider plus précisément !

