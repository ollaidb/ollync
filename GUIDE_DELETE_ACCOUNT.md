# Guide de Configuration - Suppression de Compte

Ce guide explique comment configurer la fonctionnalité de suppression de compte dans votre application Ollync.

## Configuration requise

Pour que la suppression de compte fonctionne, vous devez exécuter le script SQL `create_delete_account_function.sql` dans le SQL Editor de Supabase.

## Étapes d'installation

### 1. Exécuter le script SQL

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq
2. Allez dans **SQL Editor**
3. Cliquez sur **New query**
4. Copiez le contenu du fichier `supabase/create_delete_account_function.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** ou appuyez sur `Cmd/Ctrl + Enter`

### 2. Vérifier la fonction

Pour vérifier que la fonction a été créée correctement, exécutez cette requête :

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'delete_user_account';
```

Vous devriez voir `delete_user_account` dans les résultats.

## Fonctionnement

### Ce qui se passe lors de la suppression

Quand un utilisateur supprime son compte :

1. La fonction `delete_user_account()` est appelée via RPC
2. Elle supprime le profil de l'utilisateur dans `profiles`
3. Grâce aux contraintes `ON DELETE CASCADE`, toutes les données associées sont automatiquement supprimées :
   - Toutes les publications (`posts`)
   - Tous les likes, commentaires, partages
   - Tous les messages et conversations
   - Tous les abonnements (`follows`)
   - Toutes les candidatures (`applications`)
   - Toutes les notifications
   - Toutes les autres données liées à l'utilisateur

**Note importante** : Cette fonction SQL ne peut pas supprimer l'utilisateur de `auth.users` (cela nécessite l'API Admin). L'utilisateur restera dans `auth.users` mais sans aucune donnée associée. Pour une suppression complète, vous devez créer une Edge Function (voir section "Alternative" ci-dessous).

### Interface utilisateur

L'utilisateur doit :
1. Aller dans **Paramètres** > **Suppression de compte**
2. Lire la liste détaillée de ce qui sera supprimé
3. Confirmer deux fois son intention de supprimer
4. Le compte sera supprimé définitivement et l'utilisateur sera déconnecté

## Note importante

**ATTENTION** : La suppression de compte est **IRRÉVERSIBLE**. Une fois supprimé, toutes les données sont perdues définitivement. L'utilisateur devra créer un nouveau compte s'il souhaite utiliser à nouveau l'application.

## Dépannage

### La fonction n'existe pas

Si vous obtenez l'erreur "function does not exist", assurez-vous d'avoir exécuté le script SQL dans le SQL Editor de Supabase.

### Erreur de permissions

Si vous obtenez une erreur de permissions, vérifiez que la fonction a bien reçu les permissions avec :
```sql
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
```

### Alternative : Edge Function (Recommandé pour la production)

Pour une solution plus robuste en production, vous pouvez créer une Edge Function Supabase qui utilise l'API Admin pour supprimer le compte. Cela offre plus de contrôle et de sécurité.

1. Créez une Edge Function dans Supabase
2. Utilisez `supabase.auth.admin.deleteUser()` avec la clé service_role
3. Appelez cette fonction depuis votre application au lieu de la fonction RPC

