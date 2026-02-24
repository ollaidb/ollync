-- ============================================
-- DÉTECTION FRAUDE & MODÉRATION CONTENU
-- ============================================
-- Tables et données pour :
-- - Mots-clés fraude / arnaque / inapproprié / NSFW
-- - Activité suspecte (comportements)
-- - Réutilisation des colonnes moderation_* sur posts
-- Exécutez ce script dans le SQL Editor Supabase.

-- ---------------------------------------------------------------------------
-- 1. Table des mots-clés de modération (fraude, spam, contenu inapproprié)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('fraud', 'nsfw', 'spam', 'scam', 'phishing')),
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(keyword, category)
);

CREATE INDEX IF NOT EXISTS idx_moderation_keywords_category ON moderation_keywords(category);
CREATE INDEX IF NOT EXISTS idx_moderation_keywords_active ON moderation_keywords(is_active) WHERE is_active = true;

COMMENT ON TABLE moderation_keywords IS 'Liste de mots ou expressions pour détecter fraude, arnaque, contenu inapproprié ou pornographique';

-- ---------------------------------------------------------------------------
-- 2. Table d''activité suspecte (comportements à risque)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  source_table VARCHAR(50),
  source_id UUID,
  score INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user ON suspicious_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_type ON suspicious_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_created ON suspicious_activity(created_at DESC);

COMMENT ON TABLE suspicious_activity IS 'Log des comportements suspects (contenu flagué, volume anormal, etc.) pour analyse et protection des utilisateurs';

ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;

-- Seuls les modérateurs (ou service role) peuvent lire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'suspicious_activity' AND policyname = 'Moderator can view suspicious activity'
  ) THEN
    CREATE POLICY "Moderator can view suspicious activity" ON suspicious_activity
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND lower(profiles.email) = 'binta22116@gmail.com'
        )
      );
  END IF;
END $$;

-- L'app peut enregistrer une activité suspecte uniquement pour l'utilisateur connecté (auteur du contenu flagué)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'suspicious_activity' AND policyname = 'Users can log own suspicious activity'
  ) THEN
    CREATE POLICY "Users can log own suspicious activity" ON suspicious_activity
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Insertion des mots-clés (fraude / arnaque / inapproprié / NSFW)
-- ---------------------------------------------------------------------------
INSERT INTO moderation_keywords (keyword, category, severity) VALUES
  -- Fraude / arnaque
  ('arnaque', 'fraud', 2),
  ('escroquerie', 'fraud', 2),
  ('fraude', 'fraud', 2),
  ('faux chèque', 'fraud', 2),
  ('faux cheque', 'fraud', 2),
  ('virement urgent', 'fraud', 2),
  ('transfert d''argent', 'fraud', 1),
  ('gagner de l''argent facile', 'fraud', 2),
  ('investissement garanti', 'fraud', 2),
  ('crypto gratuit', 'fraud', 1),
  ('bitcoin gratuit', 'fraud', 1),
  ('héritage', 'fraud', 1),
  ('loterie gagnant', 'fraud', 2),
  ('prince nigeria', 'fraud', 2),
  ('compte bloqué', 'fraud', 2),
  ('urgent paiement', 'fraud', 2),
  ('prépayé', 'fraud', 1),
  ('avance de frais', 'fraud', 2),
  ('phishing', 'phishing', 2),
  ('mot de passe', 'phishing', 1),
  ('vérifiez votre compte', 'phishing', 2),
  ('cliquez ici', 'phishing', 1),
  -- Spam / racolage
  ('contactez-moi whatsapp', 'spam', 1),
  ('ajoutez mon numéro', 'spam', 1),
  ('telegram', 'spam', 1),
  ('signal', 'spam', 1),
  -- Contenu inapproprié / NSFW (français)
  ('porn', 'nsfw', 3),
  ('porno', 'nsfw', 3),
  ('xxx', 'nsfw', 3),
  ('sexe', 'nsfw', 2),
  ('nude', 'nsfw', 3),
  ('nu ', 'nsfw', 2),
  ('nus ', 'nsfw', 2),
  ('onlyfans', 'nsfw', 2),
  ('only fans', 'nsfw', 2),
  ('adulte payant', 'nsfw', 2),
  ('cam show', 'nsfw', 3),
  ('webcam adulte', 'nsfw', 3),
  ('rencontre sexuelle', 'nsfw', 3),
  ('plan cul', 'nsfw', 3),
  ('hookup', 'nsfw', 2)
ON CONFLICT (keyword, category) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Fonction SQL optionnelle : score de modération texte (côté DB)
-- Utilisable par un trigger ou par l'app via RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_moderation_text(input_text TEXT)
RETURNS TABLE(score INTEGER, reasons TEXT[])
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_score INTEGER := 0;
  found_reasons TEXT[] := '{}';
  rec RECORD;
  lower_text TEXT;
  kw TEXT;
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    score := 0;
    reasons := '{}';
    RETURN NEXT;
    RETURN;
  END IF;

  lower_text := lower(trim(input_text));

  FOR rec IN
    SELECT keyword, category, severity
    FROM moderation_keywords
    WHERE is_active = true
  LOOP
    kw := lower(rec.keyword);
    IF lower_text LIKE '%' || kw || '%' THEN
      total_score := total_score + rec.severity;
      found_reasons := array_append(found_reasons, rec.category || ':' || rec.keyword);
    END IF;
  END LOOP;

  score := least(total_score, 100);
  reasons := found_reasons;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_moderation_text(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_moderation_text(TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. S'assurer que les colonnes de modération existent sur posts
-- ---------------------------------------------------------------------------
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_flagged ON posts(moderation_status) WHERE moderation_status = 'flagged';

-- ---------------------------------------------------------------------------
-- 6. Optionnel : colonnes modération sur messages (pour log / review)
-- ---------------------------------------------------------------------------
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Modération fraude / contenu installée';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables : moderation_keywords, suspicious_activity';
  RAISE NOTICE 'Fonction : check_moderation_text(text)';
  RAISE NOTICE 'Colonnes posts : moderation_status, moderation_reason, moderation_score';
  RAISE NOTICE '';
END $$;
