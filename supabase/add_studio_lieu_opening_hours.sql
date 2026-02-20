-- Personnalisation catégorie "Lieu" (studio-lieu)
-- Stocke les jours/horaires d'ouverture et la facturation en heures.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS opening_hours JSONB,
  ADD COLUMN IF NOT EXISTS billing_hours INTEGER;

COMMENT ON COLUMN public.posts.opening_hours IS
'Horaires d''ouverture par jour pour les annonces de lieu (JSON: [{day, enabled, start, end}]).';

COMMENT ON COLUMN public.posts.billing_hours IS
'Nombre d''heures associé à la facturation de lieu (rémunération ou service contre visibilité).';
