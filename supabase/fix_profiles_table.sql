-- Script pour vérifier et corriger la table profiles pour l'inscription
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ajouter la colonne username si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username VARCHAR(100) UNIQUE;
  END IF;
END $$;

-- 3. Activer RLS sur la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 5. Créer les politiques RLS pour profiles
-- Politique pour la lecture : tous les utilisateurs peuvent voir tous les profils
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Politique pour la mise à jour : les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour l'insertion : les utilisateurs peuvent insérer leur propre profil
-- IMPORTANT : Cette politique permet l'insertion lors de l'inscription
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Créer un index sur username pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 7. Créer la fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Créer le trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Vérification : Afficher la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

