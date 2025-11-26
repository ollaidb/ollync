-- ============================================
-- SCRIPT COMPLET : CRÉATION DU BUCKET STORAGE
-- ============================================
-- Ce script crée le bucket "posts" et configure les politiques RLS
-- Exécutez ce script dans votre SQL Editor Supabase

-- ============================================
-- PARTIE 1 : CORRECTION DE LA TABLE PROFILES
-- ============================================

-- 1. Vérifier que la colonne email existe dans profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
    RAISE NOTICE 'Colonne email ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne email existe déjà dans la table profiles';
  END IF;
END $$;

-- 2. Mettre à jour les emails manquants depuis auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id 
  AND (p.email IS NULL OR p.email = '');

-- ============================================
-- PARTIE 2 : CRÉATION DU BUCKET STORAGE
-- ============================================

-- 3. Créer le bucket "posts" s'il n'existe pas
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

-- 4. Supprimer les anciennes politiques de storage.objects pour éviter les conflits
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 5. Créer les politiques RLS pour storage.objects

-- Politique pour la lecture : tout le monde peut voir les images du bucket posts
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'posts');

-- Politique pour l'insertion : les utilisateurs authentifiés peuvent uploader des images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'posts' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour la mise à jour : les utilisateurs peuvent mettre à jour leurs propres images
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'posts' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour la suppression : les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'posts' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Vérifier que le bucket a été créé
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'posts'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Bucket "posts" créé avec succès';
  ELSE
    RAISE WARNING '❌ Bucket "posts" n''a pas pu être créé';
  END IF;
END $$;

-- 7. Afficher les informations du bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'posts';

-- Script terminé
SELECT 'Script de création du bucket storage terminé avec succès!' AS status;

