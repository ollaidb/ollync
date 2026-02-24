-- ============================================
-- AJOUT DE LA COLONNE ROLE À conversation_participants
-- ============================================
-- Permet de gérer les rôles dans les groupes : member, moderator (admin)
-- Exécutez ce script dans le SQL Editor Supabase.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_participants'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE conversation_participants
      ADD COLUMN role TEXT DEFAULT 'member';
    RAISE NOTICE '✅ Colonne role ajoutée à conversation_participants';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne role existe déjà dans conversation_participants';
  END IF;
END $$;

-- Valeurs possibles : 'member', 'moderator'
-- Le créateur du groupe est identifié via conversations.group_creator_id
