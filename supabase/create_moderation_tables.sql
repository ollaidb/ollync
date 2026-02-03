-- ============================================
-- TABLES POUR LA MODERATION
-- ============================================
-- Ce script configure la table reports et une fonction de suppression admin
-- Exécutez ce script dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des signalements (si elle n'existe pas deja)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  report_reason VARCHAR(100) NOT NULL,
  report_category VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_post ON reports(reported_post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reports'
      AND policyname = 'Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports" ON reports
      FOR INSERT
      WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reports'
      AND policyname = 'Users can view their own reports'
  ) THEN
    CREATE POLICY "Users can view their own reports" ON reports
      FOR SELECT
      USING (auth.uid() = reporter_id);
  END IF;
END $$;

-- Acces moderation via email (lecture + mise a jour)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reports'
      AND policyname = 'Moderator can view all reports'
  ) THEN
    CREATE POLICY "Moderator can view all reports" ON reports
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reports'
      AND policyname = 'Moderator can update report status'
  ) THEN
    CREATE POLICY "Moderator can update report status" ON reports
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND lower(profiles.email) = 'binta22116@gmail.com'
        )
      );
  END IF;
END $$;

-- Acces lecture pour les annonces signalees (admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Moderator can view all posts'
  ) THEN
    CREATE POLICY "Moderator can view all posts" ON posts
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

-- Fonctions de moderation (SECURITY DEFINER)
-- Supprimer un post
CREATE OR REPLACE FUNCTION public.delete_post_as_admin(target_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_email TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez etre connecte';
  END IF;

  SELECT email INTO current_email
  FROM public.profiles
  WHERE id = current_user_id;

  IF lower(current_email) <> 'binta22116@gmail.com' THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  DELETE FROM public.posts WHERE id = target_post_id;
END;
$$;

-- Supprimer un profil (suppression en cascade des donnees publiques)
CREATE OR REPLACE FUNCTION public.delete_profile_as_admin(target_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_email TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez etre connecte';
  END IF;

  SELECT email INTO current_email
  FROM public.profiles
  WHERE id = current_user_id;

  IF lower(current_email) <> 'binta22116@gmail.com' THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  DELETE FROM public.profiles WHERE id = target_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_post_as_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_profile_as_admin(UUID) TO authenticated;

-- Mise a jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reports_updated_at_trigger ON reports;
CREATE TRIGGER update_reports_updated_at_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();
