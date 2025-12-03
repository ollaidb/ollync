# Guide d'Installation - Système de Messagerie

## 📋 Vérification rapide

Pour vérifier si les tables de messagerie sont déjà en place, exécutez le script :
**`supabase/verify_messaging_tables.sql`** dans votre SQL Editor Supabase.

## 🚀 Installation (si les tables n'existent pas)

### Étape 1 : Créer les tables de messagerie

1. **Ouvrez votre projet Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Ouvrez le **SQL Editor**

2. **Exécutez le script principal**
   - Copiez le contenu du fichier **`supabase/create_messaging_tables.sql`**
   - Collez-le dans le SQL Editor
   - Cliquez sur **Run** ou appuyez sur `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

### Étape 2 : Installer les triggers de notifications (optionnel mais recommandé)

Pour activer les notifications automatiques lors de la réception de messages :
- Exécutez le script **`supabase/notifications_triggers.sql`**

## 📊 Tables créées

Le script crée les tables suivantes :

1. **`conversations`** - Conversations individuelles et groupes
   - Supporte les conversations entre 2 utilisateurs
   - Supporte les groupes jusqu'à 10 participants
   - Peut être liée à une annonce (post_id)

2. **`conversation_participants`** - Participants aux groupes
   - Liste des participants actifs dans les groupes
   - Limite de 10 participants par groupe

3. **`messages`** - Messages envoyés
   - Types : texte, annonce (post), lien
   - Support des réponses aux messages
   - Support de l'édition et suppression

4. **`message_reads`** - Suivi des lectures (pour groupes)
   - Indique quels messages ont été lus par quels utilisateurs

## ✅ Vérification après installation

Exécutez **`supabase/verify_messaging_tables.sql`** pour vérifier que tout est en place.

Vous devriez voir :
- ✅ Table conversations existe
- ✅ Table messages existe
- ✅ Table conversation_participants existe
- ✅ Table message_reads existe
- Liste des colonnes pour chaque table
- Liste des politiques RLS (Row Level Security)

## 🔒 Sécurité (RLS)

Toutes les tables ont des politiques RLS activées :
- Les utilisateurs ne peuvent voir que leurs propres conversations
- Les utilisateurs ne peuvent envoyer des messages que dans leurs conversations
- Les utilisateurs ne peuvent modifier que leurs propres messages

## ⚠️ Notes importantes

- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans problème
- Les tables existantes ne seront pas modifiées
- Les nouvelles tables seront créées avec toutes les colonnes nécessaires
- Aucune donnée existante ne sera supprimée

## 🐛 Dépannage

Si vous rencontrez des erreurs :

1. **Erreur de permissions** : Assurez-vous d'être connecté en tant qu'administrateur du projet Supabase
2. **Table déjà existe** : C'est normal, le script ignore les tables existantes
3. **Erreur de contrainte** : Vérifiez que la table `profiles` existe avant d'exécuter le script
4. **Erreur de référence** : Vérifiez que la table `posts` existe si vous utilisez les conversations liées aux annonces

## 📚 Documentation complète

Pour plus de détails, consultez **`README_MESSAGING.md`**

