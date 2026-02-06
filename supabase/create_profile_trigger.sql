-- Trigger pour créer automatiquement un profil lors de l'inscription d'un utilisateur
-- Ce trigger s'exécute automatiquement après la création d'un utilisateur dans auth.users

-- IMPORTANT : Assurez-vous que la table profiles existe avant d'exécuter ce script
-- Exécutez d'abord fix_profiles_table.sql

-- Fonction pour créer un message de bienvenue dans la messagerie
-- Cherche un profil "ollync" existant et envoie un message au nouvel utilisateur
CREATE OR REPLACE FUNCTION public.create_welcome_message(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_system_user_id UUID;
  v_conversation_id UUID;
  v_welcome_message TEXT;
BEGIN
  SELECT id
  INTO v_system_user_id
  FROM public.profiles
  WHERE lower(email) = 'binta22116@gmail.com'
  LIMIT 1;

  IF v_system_user_id IS NULL OR v_system_user_id = p_user_id THEN
    RETURN;
  END IF;

  v_welcome_message := E'Bienvenue sur Ollync Ollync est une plateforme de mise en relation pour creer des collaborations simplement et rapidement nous vous souhaitons une belle experience sur l''application';

  SELECT id
  INTO v_conversation_id
  FROM public.conversations
  WHERE is_group = false
    AND (
      (user1_id = v_system_user_id AND user2_id = p_user_id)
      OR (user1_id = p_user_id AND user2_id = v_system_user_id)
    )
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id, is_group)
    VALUES (v_system_user_id, p_user_id, false)
    RETURNING id INTO v_conversation_id;
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, message_type, content)
  VALUES (v_conversation_id, v_system_user_id, 'text', v_welcome_message);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  BEGIN
    PERFORM public.create_welcome_message(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la creation du message de bienvenue pour l''utilisateur %: %', NEW.id, SQLERRM;
  END;

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
