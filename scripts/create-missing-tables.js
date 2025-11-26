/**
 * Script pour créer automatiquement les tables manquantes
 * Utilise l'API Supabase pour exécuter le SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

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
 * Crée les tables manquantes via psql si disponible
 */
async function createTablesWithPsql() {
  const sqlFile = path.join(__dirname, '../supabase/create-missing-tables.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`);
    return false;
  }
  
  console.log('📝 Tentative de création via psql...\n');
  
  // Vérifier si psql est disponible
  try {
    await execPromise('which psql');
  } catch (error) {
    console.log('⚠️  psql n\'est pas installé. Utilisation de l\'approche alternative.\n');
    return false;
  }
  
  // Demander le mot de passe
  const DB_PASSWORD = process.env.DB_PASSWORD;
  
  if (!DB_PASSWORD) {
    console.log('📝 Pour créer automatiquement avec psql:');
    console.log('   export DB_PASSWORD="votre-mot-de-passe"');
    console.log('   node scripts/create-missing-tables.js\n');
    return false;
  }
  
  try {
    const DB_URL = `postgresql://postgres@db.abmtxvyycslskmnmlniq:5432/postgres`;
    const command = `PGPASSWORD="${DB_PASSWORD}" psql "${DB_URL}" -f "${sqlFile}"`;
    
    console.log('📖 Exécution du script SQL...\n');
    const { stdout, stderr } = await execPromise(command);
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('NOTICE')) console.error(stderr);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Création des tables manquantes\n');
  
  // Vérifier quelles tables manquent
  const missingTables = [];
  
  if (!(await tableExists('conversations'))) {
    missingTables.push('conversations');
  }
  
  if (!(await tableExists('conversation_participants'))) {
    missingTables.push('conversation_participants');
  }
  
  if (missingTables.length === 0) {
    console.log('✅ Toutes les tables existent déjà!\n');
    return;
  }
  
  console.log(`❌ Tables manquantes: ${missingTables.join(', ')}\n`);
  
  // Essayer de créer via psql
  const created = await createTablesWithPsql();
  
  if (created) {
    console.log('✅ Tables créées avec succès!\n');
    
    // Vérifier à nouveau
    console.log('🔍 Vérification...\n');
    for (const table of missingTables) {
      const exists = await tableExists(table);
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'CRÉÉE' : 'TOUJOURS MANQUANTE'}`);
    }
    return;
  }
  
  // Si psql n'est pas disponible, afficher les instructions
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 CRÉATION MANUELLE DES TABLES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Pour créer les tables manquantes:\n');
  console.log('OPTION 1: Via le SQL Editor (Recommandé)');
  console.log('1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
  console.log('2. Copiez le contenu du fichier: supabase/create-missing-tables.sql');
  console.log('3. Collez dans le SQL Editor');
  console.log('4. Cliquez sur "Run"\n');
  
  console.log('OPTION 2: Via psql (Automatique)');
  console.log('1. Obtenez votre mot de passe: Supabase Dashboard > Settings > Database');
  console.log('2. Exécutez:');
  console.log('   export DB_PASSWORD="votre-mot-de-passe"');
  console.log('   node scripts/create-missing-tables.js\n');
  
  const sqlFile = path.join(__dirname, '../supabase/create-missing-tables.sql');
  console.log(`📄 Fichier SQL prêt: ${sqlFile}\n`);
}

// Exécuter
main().catch(console.error);

