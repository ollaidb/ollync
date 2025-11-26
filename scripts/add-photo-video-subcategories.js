/**
 * Script pour ajouter Photo et Vidéo comme sous-catégories de "Création de contenu"
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 Ajout des sous-catégories Photo et Vidéo pour "Création de contenu"\n');

  try {
    // 1. Trouver la catégorie Match
    const { data: matchCategory, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'match')
      .single();

    if (catError || !matchCategory) {
      throw new Error('Catégorie Match non trouvée');
    }

    // 2. Trouver la sous-catégorie "Création de contenu"
    const { data: creationSubCat, error: subCatError } = await supabase
      .from('sub_categories')
      .select('id')
      .eq('category_id', matchCategory.id)
      .eq('slug', 'creation-contenu')
      .single();

    if (subCatError || !creationSubCat) {
      throw new Error('Sous-catégorie "Création de contenu" non trouvée');
    }

    console.log('✅ Catégorie Match et sous-catégorie "Création de contenu" trouvées\n');

    // 3. Ajouter Photo et Vidéo comme sous-catégories
    const newSubCategories = [
      { name: 'Photo', slug: 'photo', parent_id: creationSubCat.id },
      { name: 'Vidéo', slug: 'video', parent_id: creationSubCat.id }
    ];

    // Note: Comme la structure actuelle ne supporte que 2 niveaux,
    // nous allons créer Photo et Vidéo comme sous-catégories directes de Match
    // mais avec un slug spécial pour les identifier comme sous-sous-catégories
    // OU nous utilisons le champ media_type existant dans posts

    // Solution: Créer Photo et Vidéo comme sous-catégories de Match
    // avec des slugs uniques: creation-contenu-photo et creation-contenu-video
    const photoVideoSubCategories = [
      { name: 'Photo', slug: 'creation-contenu-photo', category_id: matchCategory.id },
      { name: 'Vidéo', slug: 'creation-contenu-video', category_id: matchCategory.id }
    ];

    console.log('📝 Insertion des sous-catégories Photo et Vidéo...\n');

    for (const subCat of photoVideoSubCategories) {
      // Vérifier si elle existe déjà
      const { data: existing } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('slug', subCat.slug)
        .single();

      if (existing) {
        console.log(`   ✅ Sous-catégorie "${subCat.name}" existe déjà`);
      } else {
        const { data, error } = await supabase
          .from('sub_categories')
          .insert(subCat)
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Erreur pour "${subCat.name}":`, error.message);
        } else {
          console.log(`   ✅ Sous-catégorie créée: ${subCat.name}`);
        }
      }
    }

    console.log('\n✅ Installation terminée!\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  }
}

main();

