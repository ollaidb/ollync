# Résumé des Tables de la Base de Données Ollync

## Tables Existantes (15 tables)

### 1. **categories**
- Catégories principales (Match, Recrutement, Projet, Service, Vente, Mission, Autre)
- Champs: id, name, slug, icon, color, created_at, updated_at

### 2. **profiles**
- Profils utilisateurs (étend auth.users)
- Champs: id, email, username, full_name, avatar_url, phone, bio, location, created_at, updated_at

### 3. **sub_categories**
- Sous-catégories pour chaque catégorie principale
- Champs: id, category_id, name, slug, created_at

### 4. **posts**
- Annonces/publications
- Champs: id, user_id, category_id, sub_category_id, title, description, price, location, images[], delivery_available, is_urgent, needed_date, number_of_people, payment_type, media_type, status, views_count, likes_count, comments_count, shares_count, created_at, updated_at

### 5. **likes**
- Likes sur les annonces
- Champs: id, user_id, post_id, created_at

### 6. **favorites**
- Favoris des utilisateurs
- Champs: id, user_id, post_id, created_at

### 7. **comments**
- Commentaires/réponses aux annonces
- Champs: id, post_id, user_id, content, created_at, updated_at

### 8. **shares**
- Partages d'annonces
- Champs: id, post_id, user_id, created_at

### 9. **applications**
- Candidatures pour les annonces (accepter/refuser)
- Champs: id, post_id, applicant_id, status, message, created_at, updated_at

### 10. **follows**
- Abonnements entre utilisateurs
- Champs: id, follower_id, following_id, created_at

### 11. **conversations**
- Conversations entre utilisateurs
- Champs: id, post_id, user1_id, user2_id, last_message_at, created_at

### 12. **conversation_participants**
- Participants aux conversations de groupe
- Champs: id, conversation_id, user_id, joined_at

### 13. **messages**
- Messages dans les conversations
- Champs: id, conversation_id, sender_id, content, read_at, created_at

### 14. **notifications**
- Notifications des utilisateurs
- Champs: id, user_id, type, title, content, related_id, read, created_at

### 15. **matches**
- Matches entre utilisateurs
- Champs: id, user1_id, user2_id, post_id, status, created_at, updated_at

---

## Tables Manquantes Recommandées

Voici les tables supplémentaires qui pourraient être utiles :

