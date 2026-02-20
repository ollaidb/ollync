-- Tables pour pages Profil: Billets + Candidature envoyée
-- Exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date timestamptz NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_user_id ON event_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_status ON event_tickets(status);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_user_id ON candidate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_status ON candidate_applications(status);

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own tickets" ON event_tickets;
CREATE POLICY "Users can read own tickets"
ON event_tickets
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tickets" ON event_tickets;
CREATE POLICY "Users can insert own tickets"
ON event_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets" ON event_tickets;
CREATE POLICY "Users can update own tickets"
ON event_tickets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own candidate applications" ON candidate_applications;
CREATE POLICY "Users can read own candidate applications"
ON candidate_applications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own candidate applications" ON candidate_applications;
CREATE POLICY "Users can insert own candidate applications"
ON candidate_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own candidate applications" ON candidate_applications;
CREATE POLICY "Users can update own candidate applications"
ON candidate_applications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

