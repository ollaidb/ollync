/**
 * Script pour créer automatiquement le bucket Supabase Storage
 * Utilise le client Supabase pour créer le bucket et configurer les politiques
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Fonction principale - exécute le script SQL
 */
async function main() {
  console.log('🚀 Configuration du bucket Supabase Storage "posts"...\n');
  
  const sqlFile = path.join(__dirname, '..', 'supabase', 'fix_storage_and_profiles.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${sqlFile}`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  // Note: Supabase ne permet pas l'exécution SQL directe via REST API standard
  // Le script doit être exécuté dans le SQL Editor
  console.log('⚠️  IMPORTANT: Supabase ne permet pas l\'exécution SQL directe via REST API');
  console.log('📋 Le script SQL doit être exécuté dans le SQL Editor de Supabase\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CONTENU DU SCRIPT SQL À EXÉCUTER:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(sql);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('INSTRUCTIONS:');
  console.log('1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
  console.log('2. Copiez TOUT le contenu SQL ci-dessus');
  console.log('3. Collez dans le SQL Editor');
  console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Exécuter
main().catch(console.error);

