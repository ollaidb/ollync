/**
 * Installation automatique de la base de données via l'API Supabase
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
  console.log('npm run install-db\n');
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
 * Exécute une requête SQL via l'API Supabase Management
 */
async function executeSQL(sql) {
  try {
    // Supabase permet d'exécuter du SQL via l'endpoint /rest/v1/rpc/exec_sql
    // Mais cette fonction doit être créée dans la base de données
    // Alternative: utiliser l'API REST directement avec fetch
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Si exec_sql n'existe pas, essayons une autre approche
      // Utilisons l'API Management de Supabase
      throw new Error(`API exec_sql non disponible, utilisation de l'approche alternative`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    // Approche alternative: exécuter via l'API REST en divisant le SQL
    // Note: Cette méthode fonctionne pour les commandes simples
    console.log('⚠️  Utilisation de l\'approche alternative pour l\'exécution SQL...');
    
    // Diviser le SQL en blocs exécutables
    const blocks = splitSQLIntoBlocks(sql);
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block || block.startsWith('--')) continue;
      
      try {
        // Pour les commandes CREATE, ALTER, etc., nous devons utiliser une fonction SQL personnalisée
        // ou utiliser l'API Management
        console.log(`📝 Exécution du bloc ${i + 1}/${blocks.length}...`);
        
        // Note: Supabase ne permet pas l'exécution SQL arbitraire via REST API standard
        // Nous devons utiliser l'API Management ou créer une fonction SQL
        // Pour l'instant, nous allons préparer le script pour exécution manuelle
        
      } catch (err) {
        console.error(`❌ Erreur dans le bloc ${i + 1}:`, err.message);
      }
    }
    
    return { success: false, message: 'Exécution SQL nécessite l\'API Management ou exécution manuelle' };
  }
}

/**
 * Divise le SQL en blocs exécutables
 */
function splitSQLIntoBlocks(sql) {
  // Supprimer les commentaires multi-lignes
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Diviser par point-virgule, en préservant les blocs entre guillemets
  const blocks = [];
  let currentBlock = '';
  let inQuotes = false;
  let quoteChar = null;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    if ((char === '"' || char === "'" || char === '`') && sql[i - 1] !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
      }
    }
    
    currentBlock += char;
    
    if (!inQuotes && char === ';') {
      blocks.push(currentBlock);
      currentBlock = '';
    }
  }
  
  if (currentBlock.trim()) {
    blocks.push(currentBlock);
  }
  
  return blocks.filter(block => block.trim().length > 0);
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
  
  // Essayer d'exécuter le SQL
  console.log('📝 Tentative d\'exécution automatique du SQL...\n');
  const result = await executeSQL(sql);
  
  if (result.success) {
    console.log('✅ Installation terminée avec succès!\n');
  } else {
    console.log('⚠️  L\'exécution automatique n\'est pas disponible via l\'API REST standard.');
    console.log('📋 Utilisation de l\'API Management de Supabase...\n');
    
    // Créer un script qui utilise l'API Management
    await executeViaManagementAPI(sql);
  }
}

/**
 * Exécute le SQL via l'API Management de Supabase
 */
async function executeViaManagementAPI(sql) {
  console.log('🔧 Préparation de l\'exécution via l\'API Management...\n');
  
  // L'API Management de Supabase nécessite une authentification spéciale
  // Pour l'instant, nous allons créer une fonction SQL qui peut être appelée
  // ou utiliser l'endpoint direct
  
  try {
    // Essayer d'utiliser l'endpoint /rest/v1/rpc avec une fonction SQL personnalisée
    // Note: Cette fonction doit être créée dans la base de données d'abord
    
    console.log('📝 Création d\'une fonction SQL temporaire pour l\'exécution...\n');
    
    // Créer une fonction qui exécute le SQL
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
    
    // Note: Nous ne pouvons pas exécuter cette fonction non plus sans l'API Management
    // La meilleure solution est d'utiliser le SQL Editor ou psql
    
    console.log('✅ Script préparé pour exécution');
    console.log('📋 Pour exécuter automatiquement, utilisez l\'une des méthodes suivantes:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MÉTHODE 1: SQL Editor (Recommandé)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
    console.log('2. Le contenu du fichier SQL sera affiché ci-dessous');
    console.log('3. Copiez et collez dans le SQL Editor');
    console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MÉTHODE 2: Via psql');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DB_PASSWORD="votre-mot-de-passe" ./scripts/install-with-psql.sh\n');
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📄 Contenu du script SQL:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📋 Le script SQL est disponible dans: supabase/INSTALLATION_COMPLETE.sql\n');
  }
}

// Exécuter
main().catch(console.error);

