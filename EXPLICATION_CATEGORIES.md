# Explication des Catégories et Sous-Catégories

## 📋 Catégories (Menu Principal)

Les **catégories** sont les 7 catégories principales affichées dans le menu horizontal de la page d'accueil :

1. **Match** 👥
2. **Recrutement** ✓
3. **Projet** 💼
4. **Service** 🔧
5. **Vente** 🛒
6. **Mission** 📦
7. **Autre** ⋯

Ce sont les grandes sections de l'application.

---

## 📂 Sous-Catégories

Les **sous-catégories** sont les options spécifiques à l'intérieur de chaque catégorie principale. Elles permettent de filtrer plus précisément les annonces.

### Exemple : Catégorie "Match"

Quand un utilisateur clique sur **"Match"**, il peut choisir parmi ces sous-catégories :

1. **Création de contenu** - Pour trouver des partenaires pour créer du contenu (photos, vidéos)
2. **Sortie** - Pour organiser des sorties entre créateurs
3. **Événement** - Pour participer à des événements ensemble

### Exemple : Catégorie "Recrutement"

1. **Modèle** - Recherche de modèles
2. **Figurant** - Recherche de figurants

### Exemple : Catégorie "Service"

1. **Échange de service** - Échanger des services entre créateurs
2. **Tâches** - Services ponctuels
3. **Formation** - Services de formation

---

## 🗄️ Structure dans la Base de Données

### Table `categories`
Stocke les 7 catégories principales :
- id, name, slug, icon, color

### Table `sub_categories`
Stocke toutes les sous-catégories avec un lien vers leur catégorie parente :
- id, category_id (lien vers categories), name, slug

### Table `posts`
Chaque annonce a :
- `category_id` → La catégorie principale (obligatoire)
- `sub_category_id` → La sous-catégorie (optionnelle)

---

## 📱 Comment ça fonctionne dans l'application

1. **Page d'accueil** : L'utilisateur voit les 7 catégories dans le menu horizontal
2. **Clic sur une catégorie** : L'utilisateur est redirigé vers la page de la catégorie (ex: `/match`)
3. **Page de catégorie** : L'utilisateur voit les sous-catégories en navigation horizontale
4. **Clic sur une sous-catégorie** : Les annonces sont filtrées par cette sous-catégorie (ex: `/match/creation-contenu`)

---

## 📊 Liste Complète des Sous-Catégories

### Match
- Création de contenu
- Sortie
- Événement

### Recrutement
- Modèle
- Figurant

### Projet
- Associer / Collaboration

### Service
- Échange de service
- Tâches
- Formation

### Vente
- Échange
- Vente de compte
- Gratuit

### Mission
- Colis
- Vérification

### Autre
- Non classé
- Autre service

---

## 💡 Pourquoi cette structure ?

Cette hiérarchie permet :
- ✅ Une navigation claire et organisée
- ✅ Des filtres précis pour trouver rapidement ce qu'on cherche
- ✅ Une meilleure expérience utilisateur
- ✅ Une organisation logique du contenu

