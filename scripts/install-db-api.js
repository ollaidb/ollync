/**
 * Installation automatique via l'API Supabase Management
 * Ce script exécute le SQL directement via l'API REST
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERREUR: Clé service_role manquante!');
  console.log('\n📝 Pour obtenir votre clé service_role:');
  console.log('1. Allez sur https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq');
  console.log('2. Allez dans Settings > API');
  console.log('3. Copiez la clé "service_role" (secret)');
  console.log('\nEnsuite, exécutez:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="votre-clé-service-role"');
  console.log('node scripts/install-db-api.js\n');
  process.exit(1);
}

// Créer le client Supabase avec service_role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Exécute du SQL via l'API Supabase en utilisant une fonction SQL personnalisée
 */
async function executeSQLViaFunction(sql) {
  try {
    // D'abord, créer la fonction exec_sql si elle n'existe pas
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
      END;
      $$;
    `;

    // Essayer de créer la fonction via l'API REST
    // Note: Cela nécessite que la fonction soit créée manuellement d'abord
    // ou via l'API Management
    
    // Pour l'instant, utilisons une approche différente
    // Divisons le SQL en blocs et exécutons-les via l'API
    
    return { success: false, message: 'Fonction exec_sql non disponible via REST API' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Exécute le SQL via l'API Management de Supabase
 */
async function executeViaManagementAPI(sql) {
  try {
    // L'API Management de Supabase utilise un endpoint différent
    // Format: https://api.supabase.com/v1/projects/{project_ref}/database/query
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const managementURL = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    const response = await fetch(managementURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Management error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    // L'API Management nécessite un token d'accès spécial
    // Pour l'instant, retournons une erreur avec des instructions
    return { success: false, message: error.message };
  }
}

/**
 * Divise le SQL en blocs exécutables et les exécute un par un
 */
async function executeSQLBlocks(sql) {
  // Supprimer les commentaires
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  sql = sql.replace(/--.*$/gm, '');
  
  // Diviser par point-virgule
  const blocks = sql
    .split(';')
    .map(block => block.trim())
    .filter(block => block.length > 0 && !block.match(/^\s*$/));
  
  console.log(`📝 ${blocks.length} blocs SQL à exécuter\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || block.length < 10) continue; // Ignorer les blocs trop courts
    
    try {
      // Essayer d'exécuter via l'API Management
      const result = await executeViaManagementAPI(block + ';');
      
      if (result.success) {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ ${i + 1}/${blocks.length} blocs exécutés...`);
        }
      } else {
        errorCount++;
        console.error(`❌ Erreur dans le bloc ${i + 1}: ${result.message}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur dans le bloc ${i + 1}: ${error.message}`);
    }
  }
  
  return { successCount, errorCount, total: blocks.length };
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Installation automatique de la base de données Ollync\n');
  console.log('📡 Connexion à Supabase...\n');
  
  // Vérifier la connexion
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('✅ Connexion à Supabase réussie\n');
  } catch (error) {
    console.log('⚠️  Connexion vérifiée (certaines tables peuvent ne pas exister encore)\n');
  }
  
  const sqlFile = path.join(__dirname, '../supabase/INSTALLATION_COMPLETE.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${sqlFile}`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  // Essayer d'exécuter via l'API Management
  console.log('📝 Tentative d\'exécution via l\'API Management...\n');
  const result = await executeViaManagementAPI(sql);
  
  if (result.success) {
    console.log('✅ Installation terminée avec succès via l\'API Management!\n');
  } else {
    console.log('⚠️  L\'API Management n\'est pas disponible ou nécessite une authentification spéciale.');
    console.log('📋 Utilisation de l\'approche alternative...\n');
    
    // Essayer d'exécuter bloc par bloc
    const blocksResult = await executeSQLBlocks(sql);
    
    if (blocksResult.successCount > 0) {
      console.log(`\n✅ ${blocksResult.successCount}/${blocksResult.total} blocs exécutés avec succès`);
      if (blocksResult.errorCount > 0) {
        console.log(`⚠️  ${blocksResult.errorCount} erreurs rencontrées`);
      }
    } else {
      console.log('\n❌ Impossible d\'exécuter le SQL automatiquement via l\'API REST.');
      console.log('📋 Veuillez utiliser l\'une des méthodes suivantes:\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('MÉTHODE 1: SQL Editor (Recommandé)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
      console.log('2. Copiez le contenu de: supabase/INSTALLATION_COMPLETE.sql');
      console.log('3. Collez dans le SQL Editor');
      console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('MÉTHODE 2: Via psql');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('DB_PASSWORD="votre-mot-de-passe" ./scripts/install-with-psql.sh\n');
    }
  }
}

// Exécuter
main().catch(console.error);

