-- Table des matches (matchs mutuels)
-- Un match se produit quand deux utilisateurs s'intéressent mutuellement
-- - Utilisateur A swipe à droite sur un post de l'utilisateur B
-- - Utilisateur B swipe à droite sur un post de l'utilisateur A (ou accepte l'intérêt)

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post1_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  post2_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, matched, unmatched
  matched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user1_id != user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- RLS (Row Level Security)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres matches
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Politique : les utilisateurs peuvent créer des matches
CREATE POLICY "Users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs matches
CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Fonction pour créer un match automatique
-- Cette fonction vérifie si un match mutuel existe et le crée automatiquement
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  existing_match UUID;
BEGIN
  -- Récupérer le propriétaire du post
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Vérifier si le propriétaire du post a aussi swipé à droite sur un post de l'utilisateur
  SELECT id INTO existing_match
  FROM interests
  WHERE user_id = post_owner_id
    AND post_id IN (
      SELECT id FROM posts WHERE user_id = NEW.user_id
    )
  LIMIT 1;

  -- Si un intérêt mutuel existe, créer un match
  IF existing_match IS NOT NULL THEN
    -- Vérifier si le match n'existe pas déjà
    IF NOT EXISTS (
      SELECT 1 FROM matches
      WHERE (user1_id = NEW.user_id AND user2_id = post_owner_id)
         OR (user1_id = post_owner_id AND user2_id = NEW.user_id)
    ) THEN
      INSERT INTO matches (user1_id, user2_id, post1_id, post2_id, status, matched_at)
      VALUES (
        NEW.user_id,
        post_owner_id,
        (SELECT id FROM posts WHERE user_id = NEW.user_id LIMIT 1),
        NEW.post_id,
        'matched',
        NOW()
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un match
CREATE TRIGGER trigger_check_match
  AFTER INSERT ON interests
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_match();

-- Table pour stocker les posts ignorés (swipe à gauche)
CREATE TABLE IF NOT EXISTS ignored_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Index pour ignored_posts
CREATE INDEX IF NOT EXISTS idx_ignored_posts_user_id ON ignored_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ignored_posts_post_id ON ignored_posts(post_id);

-- RLS pour ignored_posts
ALTER TABLE ignored_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ignored posts"
  ON ignored_posts FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE matches IS 'Stores mutual matches between users';
COMMENT ON TABLE ignored_posts IS 'Stores posts that users have swiped left on (not interested)';

