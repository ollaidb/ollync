# Vérifier les URLs Configurées pour Apple OAuth

## ✅ Ce qui est correct

- Services ID créé : `com.ollync.web` ✓
- Sign in with Apple activé ✓
- Configuration associée : `WR5724DCAN.com.ollync.mobile` ✓ (c'est normal)
- 2 Website URLs configurées ✓

## 🔍 Vérification IMPORTANTE des URLs

Il faut vérifier que les URLs configurées sont correctes.

### Comment vérifier/modifier les URLs

1. Sur la page du Services ID, à droite de "Sign In with Apple", vous voyez :
   `WR5724DCAN.com.ollync.mobile (2 Website URLs)`

2. **Cliquez sur cette ligne** ou sur "WR5724DCAN.com.ollync.mobile" pour voir/modifier la configuration

3. Vérifiez que les URLs contiennent :
   - **Domains and Subdomains** : `ollync.app`
   - **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
     - ⚠️ Cette URL doit être EXACTE
     - Pas de slash à la fin
     - Pas d'espace

### Si les URLs ne sont pas correctes

1. Cliquez pour éditer la configuration
2. Modifiez les URLs si nécessaire
3. Sauvegardez

## ✅ Ce qui devrait être configuré

- **Domaines** : `ollync.app`
- **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`

## 🎯 Prochaines étapes

Une fois que les URLs sont vérifiées/corrrigées :

1. ✅ Configuration Apple Developer terminée
2. 📋 Notez les informations pour Supabase :
   - Services ID : `com.ollync.web`
   - Team ID : `WR5724DCAN`
   - Key ID : `CN6345M44T`
   - Private Key : Fichier `.p8`
3. 🔧 Configurez Supabase avec ces informations

Cliquez sur la configuration pour voir les URLs et dites-moi ce que vous voyez !
