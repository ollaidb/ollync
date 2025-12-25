# 🔧 Guide : Configurer le DNS pour ollync.app sur OVH

## 📋 Étapes pour OVH

### Étape 1 : Se connecter à OVH

1. Allez sur [OVH Manager](https://www.ovh.com/manager/)
2. Connectez-vous avec vos identifiants OVH

### Étape 2 : Accéder à la Zone DNS

1. Dans le menu de gauche, cliquez sur **"Domaines"** (ou **"Domains"**)
2. Cliquez sur **"Mes domaines"** (ou **"My domains"**)
3. Recherchez et cliquez sur votre domaine **`ollync.app`**

### Étape 3 : Modifier l'Enregistrement A

1. Cliquez sur l'onglet **"Zone DNS"** (ou **"DNS Zone"**)
2. Vous verrez une liste d'enregistrements DNS

3. **Trouvez l'enregistrement A existant** :
   - Cherchez la ligne avec :
     - **Type** : `A`
     - **Sous-domaine** : `@` ou vide
     - **Destination** : `213.186.33.5` (ou une autre IP)

4. **Modifiez cet enregistrement** :
   - Cliquez sur l'icône **✏️ (crayon)** à droite de la ligne
   - Dans le champ **"Destination"** ou **"Adresse IPv4"**, remplacez `213.186.33.5` par : **`216.198.79.1`**
   - Le **TTL** peut rester à 3600 (par défaut)
   - Cliquez sur **"Valider"** ou **"Enregistrer"**

   **OU** si l'enregistrement n'existe pas ou si vous préférez :

   - Cliquez sur **"Ajouter une entrée"** ou **"Add an entry"**
   - Sélectionnez **Type** : `A`
   - **Sous-domaine** : Laissez vide ou entrez `@`
   - **Destination** : `216.198.79.1`
   - **TTL** : 3600 (par défaut)
   - Cliquez sur **"Valider"** ou **"Enregistrer"**

### Étape 4 : Vérifier les Modifications

1. Dans la liste des enregistrements DNS, vérifiez que vous avez bien :
   - Type : `A`
   - Sous-domaine : `@` (ou vide)
   - Destination : `216.198.79.1`

2. Si vous avez plusieurs enregistrements A pour `@`, **supprimez ceux qui pointent vers d'autres IPs** :
   - Cliquez sur l'icône **🗑️ (poubelle)** pour supprimer les anciens enregistrements

### Étape 5 : Propagation DNS

1. Les modifications DNS OVH se propagent généralement en **15-30 minutes**
2. Cependant, cela peut prendre jusqu'à **24 heures** dans certains cas

### Étape 6 : Vérifier la Propagation

**Méthode 1 : Commande Terminal**
```bash
dig ollync.app +short
```
**Résultat attendu :** `216.198.79.1`

**Méthode 2 : Vérifier dans Vercel**
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **ollync**
3. Allez dans **Settings** > **Domains**
4. Cliquez sur le bouton **"Refresh"** à côté de `ollync.app`
5. Le statut devrait passer de **"Invalid Configuration"** à **"Valid"** ✅

**Méthode 3 : Outil en ligne**
- Visitez [whatsmydns.net](https://www.whatsmydns.net/#A/ollync.app)
- Vérifiez que l'IP `216.198.79.1` apparaît partout dans le monde

## 📸 Aide Visuelle (Description)

Dans OVH Manager, l'interface devrait ressembler à ceci :

```
Zone DNS pour ollync.app

┌─────────────┬─────────────┬─────────────────────┬──────┐
│ Type        │ Sous-domaine│ Destination         │ TTL  │
├─────────────┼─────────────┼─────────────────────┼──────┤
│ A           │ @           │ 213.186.33.5        │ 3600 │ ← À MODIFIER
│ A           │ @           │ 216.198.79.1        │ 3600 │ ← DOIT ÊTRE COMME ÇA
└─────────────┴─────────────┴─────────────────────┴──────┘
```

**Action :** Modifiez ou supprimez l'enregistrement qui pointe vers `213.186.33.5` et assurez-vous qu'il y a un enregistrement A pointant vers `216.198.79.1`.

## ⚠️ Points Importants

1. **Un seul enregistrement A pour @** : Vous ne devriez avoir qu'**un seul** enregistrement A avec le sous-domaine `@` (ou vide), pointant vers `216.198.79.1`

2. **Ne supprimez pas les autres enregistrements** : Les enregistrements NS, SOA, MX, etc. doivent rester intacts

3. **TTL** : Vous pouvez laisser la valeur par défaut (3600 secondes = 1 heure)

4. **Sauvegarde** : Les modifications dans OVH sont généralement sauvegardées automatiquement, mais vérifiez bien que vos changements sont enregistrés

## 🆘 Dépannage

### Je ne vois pas l'onglet "Zone DNS"

- Assurez-vous d'être bien connecté à votre compte OVH
- Vérifiez que vous êtes bien sur la page du domaine `ollync.app`
- Si vous ne voyez pas la zone DNS, il se peut que votre domaine utilise les serveurs de noms d'un autre service. Dans ce cas, vous devrez modifier les DNS là-bas.

### Le DNS ne se propage pas après 24h

1. **Vérifiez que la modification est bien enregistrée dans OVH**
   - Reconnectez-vous et vérifiez que l'enregistrement A pointe bien vers `216.198.79.1`

2. **Videz le cache DNS de votre ordinateur** :
   ```bash
   # Sur macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Sur Windows (PowerShell en admin)
   ipconfig /flushdns
   
   # Sur Linux
   sudo systemd-resolve --flush-caches
   ```

3. **Testez depuis différents réseaux** (WiFi, 4G, etc.)

4. **Contactez le support OVH** si le problème persiste

### Vercel affiche toujours "Invalid Configuration"

1. Vérifiez que le DNS pointe bien vers `216.198.79.1` avec :
   ```bash
   dig ollync.app +short
   ```

2. Si c'est correct, attendez encore quelques heures (la propagation peut prendre du temps)

3. Dans Vercel, cliquez plusieurs fois sur **Refresh** avec quelques heures d'intervalle

4. Si après 48h cela ne fonctionne toujours pas, contactez le [support Vercel](https://vercel.com/support)

## ✅ Une fois que ça fonctionne

Quand le DNS est correctement configuré et que Vercel affiche "Valid" :

1. ✅ Votre site sera accessible sur `https://ollync.app`
2. ✅ Le certificat SSL sera automatiquement configuré par Vercel
3. ✅ Votre application sera en ligne avec votre domaine personnalisé

## 📞 Besoin d'Aide ?

Si vous avez des difficultés :
1. Faites une capture d'écran de votre zone DNS OVH (en masquant les infos sensibles)
2. Partagez le résultat de `dig ollync.app +short`
3. Indiquez où vous bloquez exactement

Je pourrai vous aider plus précisément !

