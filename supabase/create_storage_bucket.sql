-- ============================================
-- CRÉATION DU BUCKET STORAGE POUR LES IMAGES
-- ============================================
-- Ce script crée le bucket "posts" dans Supabase Storage
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Créer le bucket "posts" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true, -- Bucket public pour que les images soient accessibles
  52428800, -- Limite de 50MB par fichier
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Créer les politiques RLS pour le bucket "posts"

-- Politique pour la lecture : tout le monde peut voir les images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'posts');

-- Politique pour l'insertion : les utilisateurs authentifiés peuvent uploader des images
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'posts' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour la mise à jour : les utilisateurs peuvent mettre à jour leurs propres images
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'posts' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour la suppression : les utilisateurs peuvent supprimer leurs propres images
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'posts' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Vérifier que le bucket a été créé
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'posts';

-- Script terminé
SELECT 'Bucket "posts" créé avec succès!' AS status;

