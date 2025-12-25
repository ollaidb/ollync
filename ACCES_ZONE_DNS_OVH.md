# 🎯 Comment Accéder à la Zone DNS dans OVH

## ⚠️ Vous êtes actuellement dans la mauvaise section

D'après votre écran, vous êtes dans la section **"MX Plan"** qui concerne les **emails**.

Pour modifier le DNS du domaine, vous devez accéder à la **Zone DNS**.

## ✅ Navigation vers la Zone DNS

### Option 1 : Via le Menu Principal (Recommandé)

1. **Dans le menu de gauche**, cliquez sur **"Noms de domaine"** (déjà ouvert)
2. Cliquez directement sur **"ollync.app"** dans la liste
3. Dans les **onglets en haut**, cherchez :
   - **"Zone DNS"** 
   - OU **"DNS"**
   - OU **"Zone"**

   (Ces onglets sont généralement à côté de "Informations générales", "Emails", etc.)

### Option 2 : Si vous ne voyez pas l'onglet Zone DNS

1. **Dans le menu de gauche**, sous "Noms de domaine", il devrait y avoir :
   - Une liste de vos domaines
   - **Cliquez directement sur "ollync.app"** (pas sur "MX Plan / ollync.app")

2. Ou cherchez dans le menu une option comme :
   - **"Zone DNS"**
   - **"DNS"**
   - **"Gestion de la zone DNS"**

### Option 3 : Via l'URL Directe

Si vous avez accès, vous pouvez essayer cette URL :
```
https://www.ovh.com/manager/web/#/zone/ollync.app
```

## 📍 Ce que vous devriez voir dans la Zone DNS

Une fois dans la Zone DNS, vous verrez un tableau avec des colonnes comme :

| Type | Sous-domaine | Destination | TTL | Actions |
|------|--------------|-------------|-----|---------|
| A    | @            | 213.186.33.5 | 3600 | ✏️ 🗑️ |
| MX   | @            | mx1.mail.ovh.net. | ... | ✏️ |
| ...  | ...          | ...         | ... | ... |

## 🔧 Une fois dans la Zone DNS

1. **Trouvez la ligne avec** :
   - **Type** : `A`
   - **Sous-domaine** : `@`
   - **Destination** : `213.186.33.5` (ou autre IP)

2. **Cliquez sur l'icône ✏️ (crayon)** à droite

3. **Changez la Destination** pour : `216.198.79.1`

4. **Validez** ou **Enregistrez**

## 🆘 Si vous ne trouvez toujours pas la Zone DNS

### Vérification : Utilisez-vous les serveurs DNS d'OVH ?

Il est possible que votre domaine utilise les serveurs DNS d'un autre service (comme Cloudflare, Namecheap, etc.).

**Comment vérifier :**

1. Dans la page où vous êtes actuellement ("Informations générales")
2. Cherchez une section qui mentionne :
   - **"Serveurs DNS"** ou **"Nameservers"**
   - **"Serveurs de noms"**

3. Si les serveurs DNS ne sont **pas** ceux d'OVH (par exemple, si vous voyez des serveurs Cloudflare ou autre), alors :
   - Vous devez modifier le DNS **chez ce service**, pas chez OVH
   - Ou vous pouvez changer les serveurs DNS pour utiliser ceux d'OVH

### Alternative : Changer les Serveurs DNS

Si vous préférez gérer le DNS chez OVH :

1. Dans la section où vous êtes, cherchez **"Serveurs DNS"**
2. Changez les serveurs DNS pour utiliser ceux d'OVH (si ce n'est pas déjà le cas)
3. Attendez quelques heures que le changement se propage
4. Ensuite, vous pourrez accéder à la Zone DNS

## 📸 Aide Visuelle

Dans OVH, la navigation devrait ressembler à ceci :

```
OVH Manager
├── Noms de domaine
│   ├── ollync.app  ← Cliquez ICI (pas sur "MX Plan")
│   │   ├── Informations générales ← Vous êtes ICI actuellement
│   │   ├── Zone DNS  ← Vous devez aller ICI ⭐
│   │   ├── Emails
│   │   └── ...
```

## ✅ Prochaines Étapes

Une fois que vous êtes dans la **Zone DNS** :

1. Trouvez l'enregistrement **A** avec **Sous-domaine** = `@`
2. Modifiez la **Destination** de `213.186.33.5` vers `216.198.79.1`
3. Enregistrez
4. Attendez 15-30 minutes
5. Vérifiez avec `dig ollync.app +short`
6. Dans Vercel, cliquez sur **Refresh**

## 📞 Si vous bloquez

Si vous ne trouvez pas la Zone DNS après avoir essayé ces étapes :

1. Faites une capture d'écran de la page où vous êtes
2. Montrez-moi tous les onglets/options disponibles
3. Je pourrai vous guider plus précisément

Ou indiquez-moi :
- Quels onglets/menus vous voyez actuellement dans OVH
- Si vous voyez une option "Zone DNS" quelque part

