# Guide d'installation - Messagerie complète Ollync

Ce guide vous explique comment installer toutes les fonctionnalités avancées de la messagerie.

## 📋 Prérequis

- Avoir exécuté `supabase/fix_infinite_recursion.sql` pour corriger la récursion infinie
- Avoir les tables de base de messagerie créées (`create_messaging_tables.sql`)

## 🚀 Installation

### Étape 1 : Corriger la récursion infinie (CRITIQUE)

**Exécutez d'abord ce script dans votre SQL Editor Supabase :**
```
supabase/fix_infinite_recursion.sql
```

Ce script corrige l'erreur "infinite recursion detected in policy" qui empêche la création de conversations.

### Étape 2 : Étendre les fonctionnalités

**Exécutez ensuite ce script :**
```
supabase/extend_messaging_features.sql
```

Ce script ajoute :
- ✅ Tous les types de messages (texte, photos, vidéos, documents, partage annonce/profil, localisation, prix, tarif, calendrier)
- ✅ Système de likes sur les messages
- ✅ Signalements de messages
- ✅ Blocage d'utilisateurs
- ✅ Préférences de conversation (notifications, archivage, mute)
- ✅ Support complet des groupes (nom, photo)
- ✅ Système de matchs

## 📊 Nouvelles tables créées

1. **message_likes** - Likes sur les messages
2. **message_reports** - Signalements de messages
3. **user_blocks** - Blocage d'utilisateurs
4. **conversation_preferences** - Préférences par conversation (notifications, archivage)
5. **matches** - Système de matchs

## 🔧 Colonnes ajoutées

### Table `messages` :
- `message_type` - Type de message (text, photo, video, document, post_share, profile_share, location, price, rate, calendar_request)
- `file_url`, `file_name`, `file_size`, `file_type` - Pour les fichiers
- `shared_post_id` - Pour partager une annonce
- `shared_profile_id` - Pour partager un profil
- `location_data` (JSONB) - Données de localisation
- `price_data` (JSONB) - Données de prix
- `rate_data` (JSONB) - Données de tarif
- `calendar_request_data` (JSONB) - Données de demande calendrier
- `is_deleted`, `deleted_for_user_id` - Suppression soft
- `reply_to_message_id` - Réponses aux messages

### Table `conversations` :
- `group_photo_url` - Photo de groupe
- `is_archived` - Archivage global

## ✅ Vérification

Après l'exécution des scripts, vérifiez que :
1. ✅ Aucune erreur dans la console Supabase
2. ✅ Les nouvelles tables sont créées
3. ✅ Les politiques RLS sont actives
4. ✅ Vous pouvez créer une conversation sans erreur de récursion

## 🎯 Prochaines étapes

Une fois les scripts exécutés, l'interface utilisateur sera mise à jour pour supporter toutes ces fonctionnalités.

