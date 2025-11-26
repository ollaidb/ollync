/**
 * Script pour vérifier et créer les tables manquantes
 * Utilise l'API Supabase pour vérifier l'état de la base de données
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Liste des tables attendues
const EXPECTED_TABLES = [
  'categories',
  'profiles',
  'sub_categories',
  'posts',
  'likes',
  'favorites',
  'comments',
  'shares',
  'applications',
  'follows',
  'conversations',
  'conversation_participants',
  'messages',
  'message_reads',
  'notifications',
  'matches'
];

/**
 * Vérifie si une table existe
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // Si pas d'erreur ou erreur de permission (table existe mais pas de données), la table existe
    if (!error || error.code === 'PGRST116' || error.message.includes('permission')) {
      return true;
    }
    
    // Erreur "relation does not exist" signifie que la table n'existe pas
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      return false;
    }
    
    // Autre erreur, on assume que la table existe
    return true;
  } catch (error) {
    // En cas d'erreur, on assume que la table n'existe pas
    return false;
  }
}

/**
 * Vérifie quelles colonnes existent dans une table
 */
async function getTableColumns(tableName) {
  try {
    // Essayer de sélectionner toutes les colonnes
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      // Si erreur, on ne peut pas déterminer les colonnes
      return [];
    }
    
    // Si pas de données, on ne peut pas déterminer les colonnes via cette méthode
    // On retourne un tableau vide pour indiquer qu'on ne peut pas vérifier
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Vérifie toutes les tables
 */
async function checkAllTables() {
  console.log('🔍 Vérification des tables dans la base de données...\n');
  
  const results = {};
  
  for (const table of EXPECTED_TABLES) {
    const exists = await tableExists(table);
    results[table] = exists;
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${table}: ${exists ? 'EXISTE' : 'MANQUANTE'}`);
  }
  
  return results;
}

/**
 * Génère un rapport des tables manquantes
 */
function generateReport(results) {
  const missing = Object.entries(results)
    .filter(([_, exists]) => !exists)
    .map(([table, _]) => table);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RAPPORT DE VÉRIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const existing = Object.entries(results)
    .filter(([_, exists]) => exists)
    .map(([table, _]) => table);
  
  console.log(`✅ Tables existantes: ${existing.length}/${EXPECTED_TABLES.length}`);
  existing.forEach(table => console.log(`   - ${table}`));
  
  if (missing.length > 0) {
    console.log(`\n❌ Tables manquantes: ${missing.length}`);
    missing.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n📝 Pour créer les tables manquantes:');
    console.log('   1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
    console.log('   2. Exécutez le script: supabase/INSTALLATION_COMPLETE.sql');
    console.log('   3. Ou exécutez les scripts spécifiques pour chaque table manquante\n');
  } else {
    console.log('\n✅ Toutes les tables existent!\n');
  }
  
  return { existing, missing };
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Vérification de la base de données Ollync\n');
  console.log('📡 Connexion à Supabase...\n');
  
  try {
    const results = await checkAllTables();
    const report = generateReport(results);
    
    // Créer un fichier de rapport
    const reportFile = path.join(__dirname, '../database-report.json');
    fs.writeFileSync(reportFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      tables: results,
      existing: report.existing,
      missing: report.missing
    }, null, 2));
    
    console.log(`\n📄 Rapport sauvegardé dans: ${reportFile}\n`);
    
    if (report.missing.length > 0) {
      console.log('💡 Pour créer automatiquement les tables manquantes:');
      console.log('   npm run install-db\n');
      process.exit(1);
    } else {
      console.log('✅ Base de données complète!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

// Exécuter
main();

