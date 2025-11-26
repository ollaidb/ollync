-- Trigger pour créer automatiquement un profil lors de l'inscription d'un utilisateur
-- Ce trigger s'exécute automatiquement après la création d'un utilisateur dans auth.users

-- IMPORTANT : Assurez-vous que la table profiles existe avant d'exécuter ce script
-- Exécutez d'abord fix_profiles_table.sql

-- Fonction pour créer automatiquement un profil lors de l'inscription
-- SECURITY DEFINER permet au trigger de contourner RLS
-- IMPORTANT : Utilise uniquement les données de auth.users (raw_user_meta_data)
-- Ne crée pas de noms automatiques depuis l'email
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

-- Trigger qui s'exécute après l'insertion d'un nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vérification : Afficher les triggers existants
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

