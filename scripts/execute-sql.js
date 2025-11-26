/**
 * Script pour exécuter automatiquement des scripts SQL dans Supabase
 * Utilise l'API Supabase Management pour exécuter le SQL
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
  console.log('node scripts/execute-sql.js <fichier-sql>\n');
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
 * Divise le SQL en blocs exécutables (séparés par ;)
 */
function splitSQLIntoBlocks(sql) {
  // Supprimer les commentaires
  sql = sql.replace(/--.*$/gm, '');
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Diviser par point-virgule, en gardant les blocs DO $$ ... END $$; intacts
  const blocks = [];
  let currentBlock = '';
  let inDoBlock = false;
  let dollarTag = '';
  
  const lines = sql.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début d'un bloc DO $$
    if (line.trim().match(/^DO\s+\$\$/)) {
      inDoBlock = true;
      dollarTag = '$$';
      currentBlock += line + '\n';
      continue;
    }
    
    // Détecter la fin d'un bloc DO $$ ... END $$;
    if (inDoBlock && line.trim().match(/^END\s+\$\$\s*;?\s*$/)) {
      currentBlock += line;
      blocks.push(currentBlock.trim());
      currentBlock = '';
      inDoBlock = false;
      dollarTag = '';
      continue;
    }
    
    if (inDoBlock) {
      currentBlock += line + '\n';
    } else {
      // Bloc normal
      currentBlock += line + '\n';
      
      // Si la ligne se termine par ; et qu'on n'est pas dans un bloc DO
      if (line.trim().endsWith(';') && !inDoBlock) {
        const trimmed = currentBlock.trim();
        if (trimmed.length > 0) {
          blocks.push(trimmed);
          currentBlock = '';
        }
      }
    }
  }
  
  // Ajouter le dernier bloc s'il existe
  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks.filter(block => block.length > 0 && !block.match(/^\s*$/));
}

/**
 * Exécute un bloc SQL via l'API Supabase
 */
async function executeSQLBlock(sqlBlock) {
  try {
    // Utiliser l'endpoint RPC pour exécuter le SQL
    // Note: Cela nécessite une fonction exec_sql dans la base de données
    // Pour l'instant, utilisons une approche alternative
    
    // Essayer d'exécuter via l'API REST directement
    // Supabase ne permet pas l'exécution SQL arbitraire via REST API
    // Nous devons utiliser l'API Management ou psql
    
    // Pour l'instant, utilisons fetch pour appeler l'API Management
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql_text: sqlBlock })
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  const sqlFile = process.argv[2];
  
  if (!sqlFile) {
    console.error('❌ Usage: node scripts/execute-sql.js <fichier-sql>');
    console.log('\nExemple:');
    console.log('node scripts/execute-sql.js supabase/fix_profiles_and_likes_complete.sql\n');
    process.exit(1);
  }
  
  const filePath = path.join(__dirname, '..', sqlFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  // Diviser le SQL en blocs
  const blocks = splitSQLIntoBlocks(sql);
  console.log(`📝 ${blocks.length} blocs SQL trouvés\n`);
  
  // Note: Supabase ne permet pas l'exécution SQL arbitraire via REST API standard
  // Nous devons utiliser l'API Management ou exécuter via psql
  console.log('⚠️  Supabase ne permet pas l\'exécution SQL directe via REST API standard');
  console.log('📋 Le script SQL doit être exécuté via:');
  console.log('   1. SQL Editor de Supabase (recommandé)');
  console.log('   2. psql (si vous avez le mot de passe de la base de données)');
  console.log('   3. Supabase CLI (si configuré)\n');
  
  // Afficher le contenu du fichier pour faciliter le copier-coller
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CONTENU DU SCRIPT SQL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(sql);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Pour exécuter:');
  console.log('1. Ouvrez https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
  console.log('2. Copiez le contenu ci-dessus');
  console.log('3. Collez dans le SQL Editor');
  console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Exécuter
main().catch(console.error);

