-- Durée du contrat : affichée dans le formulaire et dans l'aperçu/PDF
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_duration VARCHAR(80) DEFAULT NULL;

COMMENT ON COLUMN public.contracts.contract_duration IS 'Durée affichée du contrat (ex: 3 mois, 1 an).';
