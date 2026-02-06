-- ============================================
-- MAJ NOMS CATÉGORIES: STUDIO/LIEU + CASTING/ROLES
-- ============================================

UPDATE categories
SET name = 'Studio/Lieu', updated_at = NOW()
WHERE slug = 'studio-lieu';

UPDATE categories
SET name = 'Casting/Roles', updated_at = NOW()
WHERE slug = 'casting-role';

-- Vérification
SELECT id, name, slug FROM categories
WHERE slug IN ('studio-lieu', 'casting-role')
ORDER BY slug;
