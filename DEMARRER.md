# Démarrer l'application – Un seul lien

## Lien à utiliser (toujours le même)

**http://localhost:3000**

Page Messages : **http://localhost:3000/messages**  
Page Tickets : **http://localhost:3000/profile/tickets**

---

## Démarrage en 2 étapes

### 1. Libérer le port (si bloqué)

```bash
killall -9 node
```

### 2. Lancer l'application

```bash
cd /Users/binta/test\ ollync
npm run dev
```

Attendez le message : `Local: http://localhost:3000/`

---

## Voir les modifications

- **Rafraîchir avec le cache vidé** : `Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows)
- Gardez une seule fenêtre Chrome ouverte sur http://localhost:3000

---

## Important

- Le port est toujours **3000** (jamais 3001)
- Si "Port 3000 is already in use" → exécutez `killall -9 node` puis relancez
