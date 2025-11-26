-- ============================================
-- SCRIPT COMPLET DE CORRECTION PROFILES ET LIKES
-- ============================================
-- Ce script corrige les problèmes de profils manquants et de likes
-- Exécutez ce script dans votre SQL Editor Supabase

-- ============================================
-- PARTIE 1 : CORRECTION DE LA TABLE PROFILES
-- ============================================

-- 1. Vérifier et créer la table profiles si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email VARCHAR(255),
      username VARCHAR(100),
      full_name VARCHAR(255),
      avatar_url TEXT,
      phone VARCHAR(20),
      bio TEXT,
      location VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
    RAISE NOTICE 'Table profiles créée avec succès';
  ELSE
    RAISE NOTICE 'Table profiles existe déjà';
  END IF;
END $$;

-- 2. Activer RLS sur la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- 4. Créer les nouvelles politiques RLS pour profiles

-- Politique pour la lecture : TOUT LE MONDE peut voir tous les profils (même non authentifiés)
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT 
  USING (true);

-- Politique pour la mise à jour : les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Politique pour l'insertion : les utilisateurs authentifiés peuvent créer leur propre profil
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = id
  );

-- 5. Créer ou remplacer la fonction pour créer automatiquement un profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer le trigger pour créer automatiquement un profil lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Fonction pour synchroniser tous les utilisateurs auth.users vers profiles
CREATE OR REPLACE FUNCTION public.sync_all_profiles_from_auth()
RETURNS TABLE(synced_count INTEGER, error_count INTEGER) AS $$
DECLARE
  synced INTEGER := 0;
  errors INTEGER := 0;
  auth_user RECORD;
BEGIN
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
        email = COALESCE(EXCLUDED.email, profiles.email),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        username = COALESCE(EXCLUDED.username, profiles.username),
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

-- 8. Synchroniser tous les utilisateurs existants
DO $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM public.sync_all_profiles_from_auth();
  RAISE NOTICE 'Synchronisation terminée: % profils synchronisés, % erreurs', result.synced_count, result.error_count;
END $$;

-- ============================================
-- PARTIE 2 : CORRECTION DE LA TABLE LIKES
-- ============================================

-- 9. Vérifier et créer la table likes si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    CREATE TABLE likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);
    RAISE NOTICE 'Table likes créée avec succès';
  ELSE
    RAISE NOTICE 'Table likes existe déjà';
  END IF;
END $$;

-- 10. Vérifier que la colonne likes_count existe dans posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Colonne likes_count ajoutée à la table posts';
  END IF;
END $$;

-- 11. Activer RLS sur la table likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 12. Supprimer toutes les anciennes politiques de likes
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- 13. Créer les nouvelles politiques RLS pour likes

-- Politique pour la lecture : tout le monde peut voir les likes
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT 
  USING (true);

-- Politique pour l'insertion : les utilisateurs authentifiés peuvent créer leurs propres likes
CREATE POLICY "Users can create their own likes" ON likes
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- Politique pour la suppression : les utilisateurs peuvent supprimer leurs propres likes
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- 14. Créer ou remplacer la fonction pour mettre à jour le compteur de likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 15. Créer le trigger pour mettre à jour automatiquement le compteur
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 16. Mettre à jour le compteur de likes pour les posts existants
UPDATE posts p
SET likes_count = COALESCE((
  SELECT COUNT(*) 
  FROM likes l 
  WHERE l.post_id = p.id
), 0);

-- 17. Vérifier les permissions
GRANT SELECT, INSERT, DELETE ON TABLE likes TO authenticated;
GRANT SELECT ON TABLE likes TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE profiles TO authenticated;
GRANT SELECT ON TABLE profiles TO anon;

-- ============================================
-- PARTIE 3 : VÉRIFICATIONS ET RÉSUMÉ
-- ============================================

-- 18. Afficher un résumé
DO $$
DECLARE
  profiles_count INTEGER;
  auth_users_count INTEGER;
  likes_count INTEGER;
  posts_with_likes INTEGER;
  missing_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;
  SELECT COUNT(*) INTO likes_count FROM likes;
  SELECT COUNT(DISTINCT post_id) INTO posts_with_likes FROM likes;
  SELECT COUNT(*) INTO missing_profiles 
  FROM auth.users au 
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id);
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ DE LA CORRECTION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Utilisateurs auth.users: %', auth_users_count;
  RAISE NOTICE 'Profils dans profiles: %', profiles_count;
  RAISE NOTICE 'Profils manquants: %', missing_profiles;
  RAISE NOTICE 'Nombre total de likes: %', likes_count;
  RAISE NOTICE 'Nombre de posts avec likes: %', posts_with_likes;
  RAISE NOTICE '========================================';
  
  IF missing_profiles > 0 THEN
    RAISE WARNING 'ATTENTION: % utilisateurs n''ont pas de profil!', missing_profiles;
  END IF;
END $$;

-- 19. Afficher les utilisateurs sans profil (pour debug)
SELECT 
  au.id,
  au.email,
  'Profil manquant' AS status
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
LIMIT 10;

-- Script terminé
SELECT 'Script de correction profiles et likes terminé avec succès!' AS status;

