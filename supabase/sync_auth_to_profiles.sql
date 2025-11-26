-- ============================================
-- SCRIPT DE SYNCHRONISATION auth.users -> profiles
-- ============================================
-- Ce script garantit que les noms (full_name, username) dans profiles
-- proviennent toujours de auth.users et sont synchronisés automatiquement
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Fonction pour synchroniser auth.users vers profiles
-- Cette fonction met à jour le profil avec les données de auth.users
CREATE OR REPLACE FUNCTION public.sync_auth_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le profil avec les données de auth.users
  UPDATE public.profiles
  SET 
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    username = COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- Si le profil n'existe pas encore, le créer
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
      COALESCE(NEW.raw_user_meta_data->>'username', NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la mise à jour
    RAISE WARNING 'Erreur lors de la synchronisation du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger qui synchronise à chaque mise à jour de auth.users
DROP TRIGGER IF EXISTS sync_auth_to_profiles_trigger ON auth.users;
CREATE TRIGGER sync_auth_to_profiles_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
    OR OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.sync_auth_to_profiles();

-- 3. Modifier la fonction handle_new_user pour utiliser uniquement auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer le profil uniquement avec les données de auth.users
  -- Ne pas créer de noms automatiques
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la création de l'utilisateur
    RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour synchroniser tous les profils existants
-- Cette fonction peut être appelée manuellement pour corriger les données existantes
CREATE OR REPLACE FUNCTION public.sync_all_profiles_from_auth()
RETURNS TABLE(synced_count INTEGER, error_count INTEGER) AS $$
DECLARE
  synced INTEGER := 0;
  errors INTEGER := 0;
  auth_user RECORD;
BEGIN
  -- Parcourir tous les utilisateurs auth et synchroniser leurs profils
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, username)
      VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(auth_user.raw_user_meta_data->>'full_name', NULL),
        COALESCE(auth_user.raw_user_meta_data->>'username', NULL)
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        updated_at = NOW();
      
      synced := synced + 1;
    EXCEPTION
      WHEN OTHERS THEN
        errors := errors + 1;
        RAISE WARNING 'Erreur lors de la synchronisation du profil pour l''utilisateur %: %', auth_user.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT synced, errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Vérification : Afficher les triggers existants
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'sync_auth_to_profiles_trigger')
ORDER BY trigger_name;

-- 6. Note importante :
-- Pour synchroniser les profils existants, exécutez cette commande dans le SQL Editor :
-- SELECT * FROM public.sync_all_profiles_from_auth();
--
-- Cette commande doit être exécutée APRÈS avoir exécuté ce script complet.
-- Elle retournera le nombre de profils synchronisés et le nombre d'erreurs.
-- Exemple de résultat attendu :
--   synced_count | error_count
--  --------------+-------------
--             10 |           0

