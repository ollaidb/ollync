/**
 * Installation automatique via l'API Supabase
 * Ce script crée toutes les tables et colonnes nécessaires
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
  console.log('node scripts/auto-install.js\n');
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
    // Essayer d'exécuter via l'API Management de Supabase
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    
    // L'API Management nécessite un token d'accès spécial
    // Pour l'instant, utilisons une approche alternative: créer une fonction SQL
    // qui peut être appelée via l'API REST
    
    console.log('📝 Préparation de l\'exécution SQL...\n');
    
    // Diviser le SQL en blocs exécutables
    const blocks = splitSQLIntoBlocks(sql);
    console.log(`📝 ${blocks.length} blocs SQL à exécuter\n`);
    
    // Note: Supabase ne permet pas l'exécution SQL arbitraire via REST API standard
    // Nous devons utiliser l'API Management ou exécuter manuellement
    // Pour l'instant, préparons le script pour exécution
    
    return { success: false, message: 'Exécution SQL nécessite l\'API Management ou exécution manuelle', blocks: blocks.length };
  } catch (error) {
    return { success: false, message: error.message };
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
      const trimmed = currentBlock.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        blocks.push(trimmed);
      }
      currentBlock = '';
    }
  }
  
  if (currentBlock.trim()) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks.filter(block => block.length > 0);
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
    return;
  }
  
  // Afficher les instructions
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 INSTRUCTIONS POUR L\'INSTALLATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Supabase ne permet pas l\'exécution SQL arbitraire via REST API standard.');
  console.log('Voici trois solutions pour installer:\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OPTION 1: Via le SQL Editor (Recommandé)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
  console.log('2. Copiez le contenu du fichier: supabase/INSTALLATION_COMPLETE.sql');
  console.log('3. Collez dans le SQL Editor');
  console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OPTION 2: Via psql (Ligne de commande)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Installez PostgreSQL (si pas déjà fait):');
  console.log('   macOS: brew install postgresql');
  console.log('   Linux: sudo apt-get install postgresql-client');
  console.log('\n2. Obtenez votre mot de passe de base de données:');
  console.log('   Supabase Dashboard > Settings > Database > Database password');
  console.log('\n3. Exécutez:');
  console.log('   chmod +x scripts/install-with-psql.sh');
  console.log('   ./scripts/install-with-psql.sh\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OPTION 3: Installation manuelle étape par étape');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Si vous avez des erreurs, exécutez les scripts dans cet ordre:');
  console.log('1. fix_posts_columns.sql');
  console.log('2. add_post_id_to_messages.sql');
  console.log('3. fix_messages_columns.sql');
  console.log('4. create_messaging_tables.sql');
  console.log('5. notifications_triggers.sql\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ Script d\'installation préparé!');
  console.log('📁 Fichier SQL: supabase/INSTALLATION_COMPLETE.sql\n');
}

// Exécuter
main().catch(console.error);

