# 🔄 Vider le Cache DNS sur macOS

## ✅ Bonne nouvelle !

Le DNS est correctement configuré et propagé ! Google DNS retourne bien `216.198.79.1`.

Le problème est que votre **cache DNS local** contient encore l'ancienne adresse IP.

## 🔧 Solution : Vider le Cache DNS

### Méthode 1 : Via le Terminal (Recommandé)

Ouvrez le Terminal et exécutez ces commandes :

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

Vous devrez entrer votre **mot de passe administrateur** (votre mot de passe Mac).

### Méthode 2 : Redémarrer le Mac

Si vous préférez, vous pouvez simplement **redémarrer votre Mac**, cela vidra aussi le cache DNS.

### Méthode 3 : Désactiver/Réactiver le WiFi

1. Cliquez sur l'icône WiFi dans la barre de menu
2. Cliquez sur "Désactiver le Wi-Fi"
3. Attendez 10 secondes
4. Cliquez à nouveau et activez le Wi-Fi

## ✅ Après avoir vidé le cache

1. **Attendez 30 secondes**
2. **Essayez d'accéder à** `https://ollync.app` dans votre navigateur
3. Le site devrait maintenant fonctionner !

## 🔍 Vérification

Pour vérifier que ça fonctionne, vous pouvez aussi tester avec :

```bash
dig ollync.app +short
```

Cela devrait maintenant retourner : `216.198.79.1`

## 📝 Note

Le cache DNS se met à jour automatiquement après un certain temps, mais pour accélérer les choses, vider le cache est la meilleure solution.

