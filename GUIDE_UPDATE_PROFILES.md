# Guide de mise à jour de la base de données pour les nouvelles pages de profil

## 📋 Instructions

Pour que les nouvelles pages de profil fonctionnent correctement, vous devez exécuter le script SQL suivant dans votre SQL Editor Supabase.

## 🚀 Étapes

1. **Ouvrez votre projet Supabase**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet
   - Ouvrez le **SQL Editor**

2. **Exécutez le script**
   - Copiez le contenu du fichier `supabase/update_profiles_for_new_pages.sql`
   - Collez-le dans le SQL Editor
   - Cliquez sur **Run** ou appuyez sur `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

3. **Vérifiez les résultats**
   - Le script affichera des messages de confirmation pour chaque colonne
   - À la fin, vous verrez un tableau récapitulatif des colonnes ajoutées

## 📊 Colonnes ajoutées

Le script ajoute les colonnes suivantes à la table `profiles` :

- ✅ `is_online` (BOOLEAN) - Statut en ligne de l'utilisateur
- ✅ `two_factor_enabled` (BOOLEAN) - Activation de la connexion à deux étapes
- ✅ `data_consent_enabled` (BOOLEAN) - Consentement global pour l'utilisation des données
- ✅ `notification_preferences` (JSONB) - Préférences de notifications détaillées
- ✅ `data_consent` (JSONB) - Consentement détaillé par type de données
- ✅ `phone_verified` (BOOLEAN) - Vérification du numéro de téléphone (si pas déjà présent)

## 🔍 Vérification

Après l'exécution, vous pouvez vérifier que toutes les colonnes existent en exécutant :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN (
    'is_online',
    'two_factor_enabled',
    'data_consent_enabled',
    'notification_preferences',
    'data_consent',
    'phone_verified'
  )
ORDER BY column_name;
```

## ⚠️ Notes importantes

- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans problème
- Les colonnes existantes ne seront pas modifiées
- Les nouvelles colonnes seront créées avec des valeurs par défaut appropriées
- Aucune donnée existante ne sera supprimée

## 🎯 Fonctionnalités activées

Une fois le script exécuté, les fonctionnalités suivantes seront disponibles :

1. **Page Statut en ligne** - Gestion du statut de présence
2. **Page Numéro de téléphone** - Ajout et vérification du téléphone
3. **Page Connexion à deux étapes** - Activation/désactivation de la 2FA
4. **Page Notifications** - Gestion des préférences de notifications
5. **Page Gestion des données** - Consentement pour l'utilisation des données

## 📝 Structure des données JSONB

### notification_preferences
```json
{
  "message_mobile": true,
  "message_email": true,
  "like_mobile": true,
  "like_email": false,
  "request_received_mobile": true,
  "request_received_email": true,
  "request_accepted_mobile": true,
  "request_accepted_email": true,
  "profile_comment_mobile": true,
  "profile_comment_email": false,
  "offers_mobile": false,
  "offers_email": false,
  "news_mobile": true,
  "news_email": false,
  "tips_mobile": false,
  "tips_email": false
}
```

### data_consent
```json
{
  "experience_personalization": true,
  "experience_recommendations": true,
  "proposals_content": true,
  "proposals_matching": true,
  "agora_visibility": true,
  "agora_analytics": false,
  "analytics_usage": false,
  "analytics_improvement": false
}
```

