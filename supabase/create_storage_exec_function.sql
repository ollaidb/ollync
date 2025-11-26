-- ============================================
-- CRÉATION D'UNE FONCTION POUR EXÉCUTER DU SQL
-- ============================================
-- Cette fonction permet d'exécuter du SQL dynamique via RPC
-- ATTENTION: Utilisez avec précaution, uniquement pour les opérations de configuration

CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
END;
$$;

-- Note: Cette fonction permet d'exécuter du SQL arbitraire
-- Elle doit être utilisée avec précaution et uniquement par des administrateurs

