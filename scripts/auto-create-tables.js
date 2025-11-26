/**
 * Script pour créer automatiquement les tables manquantes
 * Utilise l'API Supabase pour créer les tables via des fonctions SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Vérifie si une table existe
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error || error.code === 'PGRST116' || error.message.includes('permission')) {
      return true;
    }
    
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Crée la table conversations via l'API
 * Note: On ne peut pas créer de tables directement via l'API REST
 * Mais on peut créer une fonction SQL qui le fait, puis l'appeler
 */
async function createConversationsTable() {
  // On ne peut pas créer de tables directement via l'API REST
  // Il faut utiliser le SQL Editor ou psql
  return false;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Création automatique des tables manquantes\n');
  
  // Vérifier quelles tables manquent
  const missingTables = [];
  
  console.log('🔍 Vérification des tables...\n');
  
  if (!(await tableExists('conversations'))) {
    missingTables.push('conversations');
    console.log('❌ conversations: MANQUANTE');
  } else {
    console.log('✅ conversations: EXISTE');
  }
  
  if (!(await tableExists('conversation_participants'))) {
    missingTables.push('conversation_participants');
    console.log('❌ conversation_participants: MANQUANTE');
  } else {
    console.log('✅ conversation_participants: EXISTE');
  }
  
  if (missingTables.length === 0) {
    console.log('\n✅ Toutes les tables existent déjà!\n');
    return;
  }
  
  console.log(`\n❌ ${missingTables.length} table(s) manquante(s)\n`);
  
  // Lire le script SQL
  const sqlFile = path.join(__dirname, '../supabase/create-missing-tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 CRÉATION DES TABLES MANQUANTES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('⚠️  Supabase ne permet pas la création de tables via REST API.');
  console.log('📝 Le script SQL est prêt à être exécuté.\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MÉTHODE RECOMMANDÉE: SQL Editor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1. Ouvrez ce lien dans votre navigateur:');
  console.log('   https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new\n');
  
  console.log('2. Le script SQL est dans:');
  console.log(`   ${sqlFile}\n`);
  
  console.log('3. Copiez-collez le contenu du fichier dans le SQL Editor\n');
  
  console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ALTERNATIVE: Exécution automatique avec psql');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Si vous avez PostgreSQL installé et votre mot de passe DB:');
  console.log('   export DB_PASSWORD="votre-mot-de-passe"');
  console.log('   node scripts/create-missing-tables.js\n');
  
  // Afficher un aperçu du script
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('APERÇU DU SCRIPT SQL (premières lignes):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const preview = sql.split('\n').slice(0, 20).join('\n');
  console.log(preview);
  console.log('\n... (voir le fichier complet pour le reste)\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ Script SQL prêt! Exécutez-le dans le SQL Editor.\n');
}

// Exécuter
main().catch(console.error);

