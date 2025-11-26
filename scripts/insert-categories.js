/**
 * Script pour insérer automatiquement les catégories et sous-catégories
 * dans la base de données Supabase via l'API REST
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Données des catégories
const categories = [
  { name: 'Match', slug: 'match', icon: 'Users', color: '#667eea' },
  { name: 'Recrutement', slug: 'recrutement', icon: 'Briefcase', color: '#9c27b0' },
  { name: 'Projet', slug: 'projet', icon: 'Briefcase', color: '#2196f3' },
  { name: 'Service', slug: 'service', icon: 'Wrench', color: '#4facfe' },
  { name: 'Vente', slug: 'vente', icon: 'ShoppingBag', color: '#f093fb' },
  { name: 'Mission', slug: 'mission', icon: 'Target', color: '#43e97b' },
  { name: 'Autre', slug: 'autre', icon: 'MoreHorizontal', color: '#ffa726' }
];

// Données des sous-catégories par catégorie
const subCategories = {
  match: [
    { name: 'Création de contenu', slug: 'creation-contenu' },
    { name: 'Sortie', slug: 'sortie' },
    { name: 'Événement', slug: 'evenement' }
  ],
  recrutement: [
    { name: 'Modèle', slug: 'modele' },
    { name: 'Figurant', slug: 'figurant' }
  ],
  projet: [
    { name: 'Associer / Collaboration', slug: 'associer-collaboration' }
  ],
  service: [
    { name: 'Échange de service', slug: 'echange-service' },
    { name: 'Tâches', slug: 'taches' },
    { name: 'Formation', slug: 'formation' }
  ],
  vente: [
    { name: 'Échange', slug: 'echange' },
    { name: 'Vente de compte', slug: 'vente-compte' },
    { name: 'Gratuit', slug: 'gratuit' }
  ],
  mission: [
    { name: 'Colis', slug: 'colis' },
    { name: 'Vérification', slug: 'verification' }
  ],
  autre: [
    { name: 'Non classé', slug: 'non-classe' },
    { name: 'Autre service', slug: 'autre-service' }
  ]
};

/**
 * Insère ou met à jour une catégorie
 */
async function upsertCategory(category) {
  try {
    // Vérifier si la catégorie existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('slug', category.slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, ce qui est OK
      throw checkError;
    }

    if (existing) {
      // Mettre à jour la catégorie existante
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          icon: category.icon,
          color: category.color,
          updated_at: new Date().toISOString()
        })
        .eq('slug', category.slug)
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ Catégorie mise à jour: ${category.name}`);
      return data;
    } else {
      // Créer une nouvelle catégorie
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ Catégorie créée: ${category.name}`);
      return data;
    }
  } catch (error) {
    console.error(`❌ Erreur pour la catégorie ${category.name}:`, error.message);
    throw error;
  }
}

/**
 * Insère ou met à jour une sous-catégorie
 */
async function upsertSubCategory(categoryId, subCategory) {
  try {
    // Vérifier si la sous-catégorie existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('sub_categories')
      .select('id, name')
      .eq('category_id', categoryId)
      .eq('slug', subCategory.slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      // Mettre à jour la sous-catégorie existante
      const { data, error } = await supabase
        .from('sub_categories')
        .update({ name: subCategory.name })
        .eq('category_id', categoryId)
        .eq('slug', subCategory.slug)
        .select()
        .single();

      if (error) throw error;
      console.log(`   ✅ Sous-catégorie mise à jour: ${subCategory.name}`);
      return data;
    } else {
      // Créer une nouvelle sous-catégorie
      const { data, error } = await supabase
        .from('sub_categories')
        .insert({
          category_id: categoryId,
          name: subCategory.name,
          slug: subCategory.slug
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`   ✅ Sous-catégorie créée: ${subCategory.name}`);
      return data;
    }
  } catch (error) {
    console.error(`   ❌ Erreur pour la sous-catégorie ${subCategory.name}:`, error.message);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Insertion des catégories et sous-catégories dans Supabase\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Vérifier la connexion
    console.log('📡 Vérification de la connexion à Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (testError && !testError.message.includes('relation') && !testError.message.includes('does not exist')) {
      throw testError;
    }
    console.log('✅ Connexion réussie\n');

    // Insérer les catégories
    console.log('📝 Insertion des catégories...\n');
    const categoryMap = new Map();

    for (const category of categories) {
      const categoryData = await upsertCategory(category);
      categoryMap.set(category.slug, categoryData.id);
    }

    console.log('\n📝 Insertion des sous-catégories...\n');

    // Insérer les sous-catégories
    for (const [categorySlug, subCats] of Object.entries(subCategories)) {
      const categoryId = categoryMap.get(categorySlug);
      if (!categoryId) {
        console.error(`❌ Catégorie ${categorySlug} non trouvée`);
        continue;
      }

      console.log(`📂 Catégorie: ${categorySlug}`);
      for (const subCat of subCats) {
        await upsertSubCategory(categoryId, subCat);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Installation terminée avec succès!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Afficher un résumé
    console.log('📊 Résumé:');
    console.log(`   • ${categories.length} catégories`);
    const totalSubCategories = Object.values(subCategories).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`   • ${totalSubCategories} sous-catégories\n`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.details) {
      console.error('Détails:', error.details);
    }
    if (error.hint) {
      console.error('Indice:', error.hint);
    }
    process.exit(1);
  }
}

// Exécuter
main();

