-- ============================================
-- SCRIPT COMPLET POUR RÉSOUDRE LES PROBLÈMES OAUTH
-- ============================================
-- Ce script fait tout ce qui est nécessaire pour que OAuth fonctionne

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
    RAISE NOTICE '✅ Colonne avatar_url ajoutée';
  END IF;
END $$;

-- 2. Créer la fonction handle_new_user améliorée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_username TEXT;
  user_avatar_url TEXT;
BEGIN
  -- Extraire le nom complet depuis différentes sources possibles
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULL
  );

  -- Extraire le nom d'utilisateur
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULL
  );

  -- Extraire l'URL de l'avatar
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
    RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. CRÉER LES PROFILS POUR TOUS LES UTILISATEURS OAUTH EXISTANTS SANS PROFIL
INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    NULL
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'username',
    NULL
  ) as username,
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture',
    NULL
  ) as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
AND p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  username = COALESCE(EXCLUDED.username, profiles.username),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  updated_at = NOW();

-- 5. Afficher les résultats
SELECT 
  'Profils créés pour les utilisateurs OAuth' as message,
  COUNT(*) as total_profils
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
);

