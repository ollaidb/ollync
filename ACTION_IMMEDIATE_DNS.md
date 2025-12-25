# ⚡ ACTION IMMÉDIATE REQUISE : Corriger le DNS

## 🔴 Problème Actuel

Votre domaine `ollync.app` pointe vers la **mauvaise adresse IP** :
- ❌ **Actuellement** : `213.186.33.5`
- ✅ **Doit pointer vers** : `216.198.79.1` (Vercel)

C'est pour cela que votre site ne fonctionne pas.

## ✅ Solution en 3 Étapes

### 1️⃣ Identifiez votre Registrar

Votre registrar est le service où vous avez **acheté** le domaine `ollync.app`.

**Comment le trouver ?**
- Vérifiez vos **emails de confirmation** d'achat
- Regardez vos **factures/relevés bancaires**
- Services courants : Namecheap, GoDaddy, OVH, Google Domains, Cloudflare, Gandi

### 2️⃣ Modifiez l'Enregistrement DNS

Une fois connecté à votre registrar :

1. Allez dans la **gestion DNS** de `ollync.app`
2. Trouvez l'**enregistrement A** qui contient `213.186.33.5`
3. **Modifiez-le** pour pointer vers : `216.198.79.1`
   - Type: **A**
   - Name/Host: **@** (ou vide)
   - Value/Address: **216.198.79.1**
4. **Sauvegardez**

### 3️⃣ Attendez et Vérifiez

1. **Attendez 15-30 minutes** (propagation DNS)
2. **Vérifiez avec cette commande :**
   ```bash
   dig ollync.app +short
   ```
   Devrait afficher : `216.198.79.1`
3. **Dans Vercel** : Cliquez sur **Refresh** à côté de `ollync.app`
4. Le statut devrait passer à **"Valid"** ✅

## 📚 Guide Détaillé

Consultez `GUIDE_FIX_DNS_OLLYNC.md` pour des instructions détaillées selon votre registrar.

## 🆘 Si vous ne savez pas quel est votre registrar

**Options :**
1. Vérifiez vos emails (recherchez "ollync.app" ou "domain")
2. Regardez vos factures/relevés bancaires
3. Essayez de vous connecter aux services courants :
   - [Namecheap.com](https://www.namecheap.com/)
   - [GoDaddy.com](https://www.godaddy.com/)
   - [OVH.com](https://www.ovh.com/)
   - [Cloudflare.com](https://www.cloudflare.com/)

Une fois identifié, suivez les instructions dans `GUIDE_FIX_DNS_OLLYNC.md` pour votre registrar spécifique.

