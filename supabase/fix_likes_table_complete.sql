-- ============================================
-- SCRIPT COMPLET DE VÉRIFICATION ET CORRECTION DE LA TABLE LIKES
-- ============================================
-- Ce script vérifie et corrige la table likes et ses politiques RLS
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Vérifier et créer la table likes si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    -- Créer la table likes
    CREATE TABLE likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    );
    
    -- Créer les index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);
    
    RAISE NOTICE 'Table likes créée avec succès';
  ELSE
    RAISE NOTICE 'Table likes existe déjà';
  END IF;
END $$;

-- 2. Vérifier que la colonne likes_count existe dans la table posts
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
  ELSE
    RAISE NOTICE 'Colonne likes_count existe déjà dans la table posts';
  END IF;
END $$;

-- 3. Activer RLS sur la table likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer toutes les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON likes;
DROP POLICY IF EXISTS "Public can view likes" ON likes;

-- 5. Créer les nouvelles politiques RLS

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

-- 6. Vérifier que les politiques sont créées
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = 'likes';
  
  IF policy_count >= 3 THEN
    RAISE NOTICE 'Politiques RLS créées avec succès (nombre: %)', policy_count;
  ELSE
    RAISE WARNING 'Nombre de politiques insuffisant (attendu: 3, trouvé: %)', policy_count;
  END IF;
END $$;

-- 7. Créer ou remplacer la fonction pour mettre à jour le compteur de likes
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

-- 8. Créer le trigger pour mettre à jour automatiquement le compteur
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON likes;

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 9. Mettre à jour le compteur de likes pour les posts existants
UPDATE posts p
SET likes_count = COALESCE((
  SELECT COUNT(*) 
  FROM likes l 
  WHERE l.post_id = p.id
), 0)
WHERE likes_count IS NULL OR likes_count = 0;

-- 10. Afficher un résumé
DO $$
DECLARE
  likes_count INTEGER;
  posts_with_likes INTEGER;
BEGIN
  SELECT COUNT(*) INTO likes_count FROM likes;
  SELECT COUNT(DISTINCT post_id) INTO posts_with_likes FROM likes;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ DE LA TABLE LIKES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Nombre total de likes: %', likes_count;
  RAISE NOTICE 'Nombre de posts avec likes: %', posts_with_likes;
  RAISE NOTICE '========================================';
END $$;

-- 11. Vérifier les permissions
GRANT SELECT, INSERT, DELETE ON TABLE likes TO authenticated;
GRANT SELECT ON TABLE likes TO anon;

-- Script terminé
SELECT 'Script de vérification et correction de la table likes terminé avec succès!' AS status;

