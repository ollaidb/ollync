-- ============================================
-- CRÉATION DU BUCKET STORAGE POUR LES PHOTOS DE GROUPES
-- ============================================
-- Ce script crée le bucket "group-photos" dans Supabase Storage
-- Exécutez ce script dans votre SQL Editor Supabase

-- Créer le bucket "group-photos" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-photos',
  'group-photos',
  true, -- Bucket public pour que les images soient accessibles
  5242880, -- Limite de 5MB par fichier
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Créer les politiques RLS pour le bucket "group-photos"

-- Politique pour la lecture : tout le monde peut voir les photos de groupes
DROP POLICY IF EXISTS "Public Access group-photos" ON storage.objects;
CREATE POLICY "Public Access group-photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'group-photos');

-- Politique pour l'insertion : les utilisateurs authentifiés peuvent uploader des photos
DROP POLICY IF EXISTS "Authenticated users can upload group photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload group photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'group-photos' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour la mise à jour : les créateurs de groupes peuvent mettre à jour les photos
DROP POLICY IF EXISTS "Group creators can update group photos" ON storage.objects;
CREATE POLICY "Group creators can update group photos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'group-photos' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour la suppression : les créateurs de groupes peuvent supprimer les photos
DROP POLICY IF EXISTS "Group creators can delete group photos" ON storage.objects;
CREATE POLICY "Group creators can delete group photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'group-photos' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Bucket group-photos créé avec succès!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Les utilisateurs peuvent maintenant:';
  RAISE NOTICE '  - Uploader des photos de groupes';
  RAISE NOTICE '  - Voir les photos de groupes';
  RAISE NOTICE '========================================';
END $$;

