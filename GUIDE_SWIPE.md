# 🎯 Guide d'utilisation du Mode Swipe

## 📍 Comment accéder à la page Swipe

### Méthode 1 : Via le Footer (Navigation principale)
1. Ouvrez l'application
2. Regardez en bas de l'écran
3. Cliquez sur l'icône **"Swipe"** (✨) dans la barre de navigation
4. Vous serez redirigé vers `/swipe`

### Méthode 2 : Via l'URL directe
Tapez dans la barre d'adresse de votre navigateur :
```
/swipe
```

### Méthode 3 : Avec filtres par catégorie
Pour swiper uniquement dans une catégorie spécifique :
```
/swipe?category=CATEGORY_ID
```

Pour une sous-catégorie :
```
/swipe?category=CATEGORY_ID&subcategory=SUBCATEGORY_ID
```

## 🎮 Comment utiliser le Swipe

### Gestes tactiles (Mobile) ou Souris (Desktop)

#### 👉 Swipe à DROITE (ou bouton ❤️)
- **Action** : Intéressé
- **Résultat** : 
  - L'annonce est ajoutée à vos intérêts
  - Le propriétaire peut voir votre intérêt
  - Si match mutuel → notification de match

#### 👈 Swipe à GAUCHE (ou bouton ❌)
- **Action** : Pas intéressé
- **Résultat** :
  - L'annonce est ignorée
  - Elle n'apparaîtra plus dans votre feed swipe

#### ⬆️ Swipe vers le HAUT (ou bouton ⭐)
- **Action** : Sauvegarder
- **Résultat** :
  - L'annonce est ajoutée à vos favoris
  - Accessible depuis la page "Favoris"

#### ⬇️ Swipe vers le BAS (ou bouton 🔍)
- **Action** : Voir détails
- **Résultat** :
  - Ouvre une modal avec plus d'informations
  - Bouton pour voir la page complète

### Boutons d'action
En bas de l'écran, vous avez 4 boutons :
- ❌ **Rejeter** : Pas intéressé
- ⭐ **Sauvegarder** : Ajouter aux favoris
- ❤️ **Intéressé** : Montrer votre intérêt
- 💬 **Message** : Contacter directement

### Fonctionnalités

#### 🔄 Annulation (Undo)
- Après chaque swipe, un bouton "Annuler" apparaît pendant 3 secondes
- Cliquez dessus pour annuler votre dernière action
- Le post précédent réapparaîtra

#### 📊 Compteur
- En haut à droite, vous voyez : `X / Y`
- X = numéro du post actuel
- Y = nombre total de posts disponibles

#### 🎨 Indicateurs visuels
- Quand vous commencez à swiper, des indicateurs apparaissent :
  - ❤️ Vert = Intéressé
  - ❌ Rouge = Pas intéressé
  - ⭐ Orange = Sauvegarder
  - 🔽 Bleu = Voir détails

## 🔧 Installation de la base de données

Avant d'utiliser le Swipe, vous devez créer les tables nécessaires :

### 1. Table des intérêts
```sql
-- Exécutez le fichier :
supabase/create_interests_table.sql
```

### 2. Table des matches
```sql
-- Exécutez le fichier :
supabase/create_matches_table.sql
```

### 3. Table des posts ignorés
La table `ignored_posts` est créée automatiquement dans `create_matches_table.sql`

## 📱 Interface

### Sur Mobile
- **Plein écran** : L'expérience est optimisée pour mobile
- **Gestes tactiles** : Glissez naturellement avec votre doigt
- **Safe areas** : Respecte les zones sécurisées (encoche iPhone, etc.)

### Sur Desktop
- **Souris** : Cliquez et glissez sur la carte
- **Boutons** : Utilisez les boutons en bas pour les actions rapides

## 🎯 Cas d'usage

### Découvrir rapidement des annonces
1. Allez sur `/swipe`
2. Swipez rapidement à droite sur ce qui vous intéresse
3. Swipez à gauche sur ce qui ne vous intéresse pas
4. Les annonces intéressantes sont sauvegardées automatiquement

### Filtrer par catégorie
1. Allez sur une catégorie (ex: `/match`)
2. Cliquez sur "Mode Swipe" si disponible
3. Ou allez directement sur `/swipe?category=CATEGORY_ID`

### Trouver des matchs
1. Swipez à droite sur les annonces qui vous intéressent
2. Si le propriétaire swipe aussi à droite sur votre profil → **MATCH** 🎉
3. Vous recevrez une notification
4. La conversation est débloquée automatiquement

## ⚙️ Configuration

### Filtrer les posts déjà swipés
Le système filtre automatiquement :
- ✅ Les posts où vous avez swipé à droite (interests)
- ✅ Les posts où vous avez swipé à gauche (ignored)
- ✅ Vos propres posts

### Recharger les posts
Si vous avez swipé tous les posts disponibles :
- Le système recharge automatiquement de nouveaux posts
- Ou affiche "Aucune annonce disponible"

## 🐛 Dépannage

### "Aucune annonce disponible"
- Vérifiez que vous avez des posts actifs dans la base de données
- Vérifiez que vous n'avez pas swipé tous les posts
- Essayez de changer de catégorie

### Les gestes ne fonctionnent pas
- Sur mobile : Assurez-vous de bien glisser avec votre doigt
- Sur desktop : Cliquez et maintenez, puis glissez
- Utilisez les boutons en bas comme alternative

### Les posts ne se filtrent pas
- Vérifiez que les tables `interests` et `ignored_posts` existent
- Vérifiez que vous êtes connecté (les filtres nécessitent un compte)

## 🚀 Prochaines améliorations

- [ ] Algorithme de recommandation personnalisé
- [ ] Limite de swipes par jour
- [ ] Notifications de match en temps réel
- [ ] Statistiques de swipes
- [ ] Mode sombre optionnel

---

**Besoin d'aide ?** Contactez le support ou consultez la documentation.

