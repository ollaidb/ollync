-- ============================================
-- SCRIPT POUR CORRIGER LA CRÉATION DE PROFIL OAuth
-- ============================================
-- Ce script s'assure que le trigger fonctionne correctement
-- pour créer automatiquement les profils lors de l'inscription OAuth (Google/Apple)

-- 1. S'assurer que la colonne avatar_url existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 2. Fonction améliorée pour créer automatiquement un profil lors de l'inscription
-- Gère les données Google OAuth (full_name, name, avatar_url, picture, etc.)
-- Gère aussi les données Apple OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_username TEXT;
  user_avatar_url TEXT;
BEGIN
  -- Extraire le nom complet depuis différentes sources possibles
  -- Google stocke dans 'full_name' ou 'name'
  -- Apple peut aussi stocker dans 'full_name'
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULL
  );

  -- Extraire le nom d'utilisateur (peut être généré depuis l'email si non fourni)
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULL
  );

  -- Extraire l'URL de l'avatar (pour Google et autres providers)
  -- Google stocke dans 'avatar_url' ou 'picture'
  user_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Créer le profil avec les données extraites
  INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_username,
    user_avatar_url
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la création de l'utilisateur
    RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. S'assurer que le trigger existe et est correctement configuré
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérification : Afficher le trigger créé
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. Note : Ce script garantit que :
--    - La colonne avatar_url existe dans la table profiles
--    - La fonction handle_new_user() extrait correctement les données OAuth
--    - Le trigger on_auth_user_created est bien créé et fonctionnel
--    - Les profils sont créés automatiquement pour Google, Apple et autres providers OAuth

