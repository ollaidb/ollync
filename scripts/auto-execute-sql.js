/**
 * Script pour exécuter automatiquement des scripts SQL dans Supabase
 * Utilise l'API Supabase pour exécuter le SQL via des requêtes RPC
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Exécute le SQL via l'API Supabase en utilisant fetch directement
 */
async function executeSQLDirectly(sql) {
  try {
    // Essayer d'exécuter via l'endpoint Management API
    // Note: Cela nécessite la clé service_role
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql_text: sql })
    });

    if (response.ok) {
      return { success: true, message: 'SQL exécuté avec succès' };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale - exécute le SQL automatiquement
 */
async function main() {
  const sqlFile = process.argv[2] || 'supabase/fix_profiles_and_likes_complete.sql';
  const filePath = path.join(__dirname, '..', sqlFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  console.log('🚀 Tentative d\'exécution automatique du SQL...\n');
  
  // Essayer d'exécuter directement
  const result = await executeSQLDirectly(sql);
  
  if (result.success) {
    console.log('✅ SQL exécuté avec succès!');
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

