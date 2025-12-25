-- Script pour améliorer le trigger de création de profil pour mieux gérer l'authentification Google
-- Ce script améliore la fonction handle_new_user() pour extraire correctement les données depuis Google OAuth

-- Fonction améliorée pour créer automatiquement un profil lors de l'inscription
-- Gère maintenant les données Google OAuth (full_name, name, avatar_url, etc.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_username TEXT;
  user_avatar_url TEXT;
BEGIN
  -- Extraire le nom complet depuis différentes sources possibles
  -- Google stocke généralement dans 'full_name' ou 'name'
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

  -- Extraire l'URL de l'avatar (pour Google)
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
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la création de l'utilisateur
    RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier que le trigger existe toujours
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Note: Si la colonne avatar_url n'existe pas dans votre table profiles,
-- vous pouvez soit l'ajouter, soit retirer cette partie du script
-- Pour ajouter la colonne avatar_url (optionnel):
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Vérification : Afficher les triggers existants
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

