# Installation du système de rendez-vous

Ce guide explique comment installer le système de rendez-vous avec notifications automatiques.

## 📋 Prérequis

- Avoir les tables de base de messagerie créées
- Avoir la table `notifications` créée

## 🚀 Installation

### Étape 1 : Créer la table appointments

Exécutez le script suivant dans votre SQL Editor Supabase :

```sql
supabase/create_appointments_table.sql
```

Ce script crée :
- ✅ La table `appointments` pour stocker les rendez-vous
- ✅ Les index nécessaires pour les performances
- ✅ Les politiques RLS pour la sécurité
- ✅ Les triggers pour mettre à jour automatiquement `updated_at`

### Étape 2 : Mettre à jour la table notifications

Exécutez le script suivant dans votre SQL Editor Supabase :

```sql
supabase/update_notifications_for_appointments.sql
```

Ce script :
- ✅ Ajoute la colonne `scheduled_at` à la table `notifications` pour programmer les notifications
- ✅ Crée les triggers pour générer automatiquement les notifications :
  - Notification immédiate lors de la création d'un rendez-vous
  - Notification un jour avant le rendez-vous (à 9h du matin)
  - Notification le jour du rendez-vous (à 8h du matin)
- ✅ Crée une fonction pour récupérer les notifications programmées à envoyer

## 📊 Structure de la table appointments

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔔 Système de notifications

### Notifications automatiques

Lorsqu'un rendez-vous est créé, le système génère automatiquement :

1. **Notification immédiate** : Informe le destinataire du nouveau rendez-vous
2. **Notification un jour avant** : Envoyée à 9h du matin la veille du rendez-vous
3. **Notification le jour J** : Envoyée à 8h du matin le jour du rendez-vous

### Types de notifications

- `appointment` : Pour les notifications liées aux rendez-vous
- `scheduled_at` : Date et heure programmée pour l'envoi (pour les notifications futures)

### Récupérer les notifications programmées

Pour récupérer les notifications qui doivent être envoyées maintenant :

```sql
SELECT * FROM get_scheduled_notifications_to_send();
```

Cette fonction peut être appelée par un cron job ou un service externe pour envoyer les notifications.

## 🎯 Utilisation dans l'application

### Créer un rendez-vous

Dans l'interface de messagerie :

1. Cliquer sur le bouton d'options (icône Share2)
2. Cliquer sur "Rendez-vous"
3. Remplir le formulaire :
   - Titre du rendez-vous
   - Date
   - Heure
4. Cliquer sur "Envoyer"

### Affichage des rendez-vous

Les rendez-vous apparaissent dans la conversation comme des messages spéciaux avec :
- Le titre du rendez-vous
- La date complète (ex: "lundi 10 janvier 2024")
- L'heure (ex: "à 14:30")

## 🔧 Fonctionnalités

### Statuts des rendez-vous

- `pending` : En attente de réponse (par défaut)
- `accepted` : Accepté par le destinataire
- `declined` : Refusé par le destinataire
- `cancelled` : Annulé par l'expéditeur

### Actions disponibles

- ✅ Créer un rendez-vous avec date et heure
- ✅ Recevoir une notification immédiate lors de la création
- ✅ Recevoir un rappel un jour avant le rendez-vous
- ✅ Recevoir un rappel le jour du rendez-vous
- ✅ Gérer le statut du rendez-vous (accepter, refuser, annuler)

## 📝 Notes importantes

1. **Validation des dates** : Les rendez-vous ne peuvent pas être créés dans le passé
2. **Notifications programmées** : Les notifications sont créées avec `scheduled_at` mais doivent être envoyées par un service externe (cron job, webhook, etc.)
3. **Suppression automatique** : Si un rendez-vous est annulé ou refusé, les notifications programmées futures sont automatiquement supprimées
4. **Notifications pour les deux utilisateurs** : Les notifications sont envoyées à la fois à l'expéditeur et au destinataire

## 🔐 Sécurité

Les politiques RLS garantissent que :
- Les utilisateurs ne peuvent voir que leurs propres rendez-vous
- Les utilisateurs ne peuvent créer des rendez-vous qu'en tant qu'expéditeur
- Les utilisateurs peuvent mettre à jour uniquement leurs propres rendez-vous

## 🐛 Dépannage

### Les notifications ne sont pas créées

Vérifiez que :
- Les triggers sont bien installés
- Les fonctions `create_appointment_notifications()` et `update_appointment_notifications()` existent
- Les triggers `trigger_create_appointment_notifications` et `trigger_update_appointment_notifications` sont actifs

### Les notifications programmées ne s'envoient pas

Les notifications avec `scheduled_at` ne sont pas envoyées automatiquement. Vous devez :
1. Créer un cron job ou un service qui appelle `get_scheduled_notifications_to_send()`
2. Envoyer les notifications récupérées via votre système de notifications (push, email, SMS, etc.)
3. Marquer les notifications comme envoyées (`read = true`)

## 📚 Ressources

- [Documentation Supabase Triggers](https://supabase.com/docs/guides/database/triggers)
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
