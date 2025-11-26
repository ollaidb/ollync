-- ============================================
-- SCRIPT DE CORRECTION DES POLITIQUES RLS POUR LIKES
-- ============================================
-- Ce script corrige les erreurs 406 (Not Acceptable) pour la table likes
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Vérifier que la table likes existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes') THEN
    -- Créer la table likes si elle n'existe pas
    CREATE TABLE likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    );
    
    -- Créer les index
    CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);
  END IF;
END $$;

-- 2. Activer RLS sur la table likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON likes;

-- 4. Créer les nouvelles politiques RLS

-- Politique pour la lecture : tout le monde peut voir les likes
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT 
  USING (true);

-- Politique pour l'insertion : les utilisateurs peuvent créer leurs propres likes
CREATE POLICY "Users can create their own likes" ON likes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour la suppression : les utilisateurs peuvent supprimer leurs propres likes
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Vérifier que les politiques sont créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'likes'
ORDER BY policyname;

-- 6. Note : Si vous avez toujours des erreurs 406, vérifiez que :
--    - L'utilisateur est bien authentifié (auth.uid() n'est pas NULL)
--    - Les colonnes user_id et post_id existent dans la table likes
--    - La table profiles existe et a des politiques RLS correctes

