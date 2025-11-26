# Configuration de la base de données Supabase

## Installation

1. Installez les dépendances :
```bash
npm install
```

## Configuration de Supabase

Les clés d'accès Supabase sont déjà configurées dans `src/lib/supabaseClient.ts`.

## Création des tables

Pour créer les tables dans votre base de données Supabase :

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase/schema.sql`
5. Exécutez le script SQL

## Structure des tables

### Categories
- Catégories des annonces (Match, Service, Vente, Mission, Autre)

### Profiles
- Profils utilisateurs (étend auth.users)

### Posts
- Annonces/publications des utilisateurs

### Favorites
- Favoris des utilisateurs

### Conversations
- Conversations entre utilisateurs

### Messages
- Messages dans les conversations

### Notifications
- Notifications des utilisateurs

### Matches
- Matches entre utilisateurs

## Sécurité (RLS)

Toutes les tables ont Row Level Security (RLS) activé avec des politiques qui permettent :
- Lecture publique des posts actifs
- Les utilisateurs ne peuvent modifier que leurs propres données
- Les utilisateurs peuvent voir leurs propres conversations, messages, favoris, etc.

## Notes importantes

⚠️ **Ne jamais exposer la clé service_role dans le code client !**
- La clé `service_role` doit être utilisée uniquement côté serveur
- Utilisez toujours la clé `anon` dans le code client

