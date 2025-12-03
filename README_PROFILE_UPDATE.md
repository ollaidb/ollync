# Guide de mise à jour de la base de données pour le profil public

## 📋 Instructions

Pour que les fonctionnalités de la page de profil public et d'édition de profil fonctionnent correctement, vous devez exécuter le script SQL suivant dans votre SQL Editor Supabase.

## 🚀 Étapes

1. **Ouvrez votre projet Supabase**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet
   - Ouvrez le **SQL Editor**

2. **Exécutez le script**
   - Copiez le contenu du fichier `supabase/update_profile_table_complete.sql`
   - Collez-le dans le SQL Editor
   - Cliquez sur **Run** ou appuyez sur `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

3. **Vérifiez les résultats**
   - Le script affichera des messages de confirmation pour chaque colonne
   - À la fin, vous verrez un tableau récapitulatif de toutes les colonnes de la table `profiles`

## 📊 Colonnes ajoutées

Le script ajoute les colonnes suivantes à la table `profiles` :

- ✅ `distance` (VARCHAR) - Rayon de recherche
- ✅ `social_links` (JSONB) - Liens vers les réseaux sociaux (Instagram, TikTok, LinkedIn, etc.)
- ✅ `phone_verified` (BOOLEAN) - Statut de vérification du téléphone
- ✅ `skills` (TEXT[]) - Tableau de compétences
- ✅ `services` (TEXT[]) - Tableau de services
- ✅ `availability` (VARCHAR) - Disponibilité
- ✅ `languages` (JSONB) - Langues parlées avec niveaux
- ✅ `badges` (TEXT[]) - Badges de vérification

## 🔍 Vérification

Après l'exécution, vous pouvez vérifier que toutes les colonnes existent en exécutant :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY column_name;
```

## ⚠️ Notes importantes

- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans problème
- Les colonnes existantes ne seront pas modifiées
- Les nouvelles colonnes seront créées avec des valeurs par défaut appropriées
- Aucune donnée existante ne sera supprimée

## 🎯 Fonctionnalités activées

Une fois le script exécuté, les fonctionnalités suivantes seront disponibles :

1. **Page d'édition du profil** (`/profile/edit`)
   - Upload de photo de profil
   - Modification du nom/pseudo
   - Ajout de localisation et distance
   - Édition de la bio
   - Gestion des compétences et services
   - Ajout de liens sociaux
   - Vérification du téléphone et de l'email

2. **Page de profil public** (`/profile/public`)
   - Affichage de toutes les informations du profil
   - Affichage des compétences et services
   - Affichage des liens sociaux
   - Badges de vérification

## 🐛 Dépannage

Si vous rencontrez des erreurs :

1. **Erreur de permissions** : Assurez-vous d'être connecté en tant qu'administrateur du projet Supabase
2. **Colonne déjà existe** : C'est normal, le script ignore les colonnes existantes
3. **Erreur de syntaxe** : Vérifiez que vous avez copié tout le script sans modification

Pour toute question, consultez la documentation Supabase : https://supabase.com/docs

