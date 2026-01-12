# Script de Diagnostic Apple OAuth

## 🔍 Problème Décrit

Vous pouvez vous connecter avec Apple jusqu'au bout (vous validez la connexion Apple), mais après :
- Le profil ne s'affiche pas
- C'est comme si aucune action n'avait été prise

## 📋 Diagnostic à Effectuer

### 1. Exécuter le Script SQL de Diagnostic

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Votre projet → **SQL Editor**
3. Créez une nouvelle requête
4. Copiez le contenu du fichier `supabase/diagnostic_apple_oauth_complet.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** (ou Cmd/Ctrl + Enter)

### 2. Analyser les Résultats

Le script va vous montrer :

#### Section 1 : Vérification du Trigger
- Le trigger `on_auth_user_created` existe-t-il ?
- Est-il correctement configuré ?

#### Section 2 : Utilisateurs Apple
- Tous les utilisateurs qui se sont connectés avec Apple
- Leurs métadonnées (nom, email, etc.)

#### Section 3 : Utilisateurs Apple SANS Profil
- Les utilisateurs Apple qui n'ont PAS de profil dans la table `profiles`
- **C'est probablement votre problème !**

#### Section 4 : Profils des Utilisateurs Apple
- Tous les profils créés pour les utilisateurs Apple
- La date de création

#### Section 5 : Statistiques
- Nombre total d'utilisateurs Apple
- Nombre de profils créés
- Combien d'utilisateurs n'ont pas de profil

#### Section 6 : Vérification de la Fonction
- La fonction `handle_new_user` existe-t-elle ?

#### Section 7 : Détails Complets
- Les 5 derniers utilisateurs Apple avec tous leurs détails

## 🔧 Solutions selon les Résultats

### Si le Trigger n'existe pas

**Solution** : Exécutez le script `supabase/complete_oauth_fix.sql` pour créer le trigger.

### Si des Utilisateurs Apple n'ont pas de Profil

**Solution 1** : Exécutez le script `supabase/manual_create_profiles_for_oauth_users.sql` pour créer les profils manquants.

**Solution 2** : Vérifiez que le trigger fonctionne correctement.

### Si le Trigger existe mais ne fonctionne pas

**Solution** : Exécutez le script `supabase/fix_oauth_profile_creation.sql` pour corriger le trigger.

## 📝 Après le Diagnostic

Une fois que vous avez exécuté le script et vu les résultats :

1. **Notez combien d'utilisateurs Apple n'ont pas de profil**
2. **Vérifiez si le trigger existe**
3. **Exécutez le script de correction approprié**

## 🆘 Si vous avez besoin d'aide

Partagez avec moi :
1. Les résultats de la section 3 (Utilisateurs Apple SANS Profil)
2. Les résultats de la section 1 (Vérification du Trigger)
3. Les résultats de la section 5 (Statistiques)

Cela m'aidera à identifier exactement le problème !
