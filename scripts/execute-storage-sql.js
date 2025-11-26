/**
 * Script pour exécuter automatiquement le SQL de création du bucket Storage
 * Utilise l'API Supabase Management pour exécuter le SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Créer le client Supabase avec service_role si disponible
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Exécute le SQL via l'API Supabase en utilisant une fonction RPC
 */
async function executeSQLViaRPC(sql) {
  try {
    // Essayer d'exécuter via une fonction RPC exec_sql si elle existe
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
    
    if (error) {
      // Si la fonction n'existe pas, on ne peut pas exécuter directement
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  const sqlFile = path.join(__dirname, '..', 'supabase', 'fix_storage_and_profiles.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${sqlFile}`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  console.log('🚀 Tentative d\'exécution automatique du SQL...\n');
  
  // Essayer d'exécuter via RPC
  const result = await executeSQLViaRPC(sql);
  
  if (result.success) {
    console.log('✅ SQL exécuté avec succès!');
    console.log('📋 Résultat:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('⚠️  Exécution automatique non disponible');
    console.log('📋 Le script SQL doit être exécuté manuellement dans le SQL Editor\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CONTENU DU SCRIPT SQL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(sql);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// Exécuter
main().catch(console.error);

