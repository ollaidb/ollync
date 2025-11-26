const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Divise le SQL en blocs exécutables
 */
function splitSQLIntoBlocks(sql) {
  // Supprimer les commentaires de ligne
  const lines = sql.split('\n');
  const cleanedLines = lines.map(line => {
    const commentIndex = line.indexOf('--');
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex);
    }
    return line;
  });
  
  const cleanedSQL = cleanedLines.join('\n');
  
  // Diviser par les points-virgules, en gardant les blocs de fonctions
  const blocks = [];
  let currentBlock = '';
  let inFunction = false;
  let dollarQuote = null;
  
  for (let i = 0; i < cleanedSQL.length; i++) {
    const char = cleanedSQL[i];
    const nextChars = cleanedSQL.substring(i, i + 2);
    
    // Détecter les dollar quotes ($$, $tag$, etc.)
    if (char === '$' && !dollarQuote) {
      const match = cleanedSQL.substring(i).match(/^\$([^$]*)\$/);
      if (match) {
        dollarQuote = match[0];
        currentBlock += dollarQuote;
        i += dollarQuote.length - 1;
        inFunction = true;
        continue;
      }
    }
    
    // Fermer le dollar quote
    if (dollarQuote && cleanedSQL.substring(i).startsWith(dollarQuote)) {
      currentBlock += dollarQuote;
      i += dollarQuote.length - 1;
      dollarQuote = null;
      inFunction = false;
      continue;
    }
    
    currentBlock += char;
    
    // Si on n'est pas dans une fonction et qu'on trouve un point-virgule
    if (!inFunction && char === ';') {
      const block = currentBlock.trim();
      if (block.length > 0) {
        blocks.push(block);
      }
      currentBlock = '';
    }
  }
  
  // Ajouter le dernier bloc s'il existe
  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks.filter(block => block.trim().length > 0);
}

/**
 * Exécute un bloc SQL via l'API Supabase
 */
async function executeSQLBlock(sqlBlock) {
  try {
    // Pour les commandes DDL (CREATE, ALTER, DROP), on ne peut pas les exécuter via REST API
    // On va essayer d'utiliser une fonction RPC si elle existe, sinon on retourne une erreur
    
    // Vérifier si c'est une commande DDL
    const isDDL = /^\s*(CREATE|ALTER|DROP|GRANT|REVOKE)/i.test(sqlBlock);
    
    if (isDDL) {
      // Pour les DDL, on ne peut pas les exécuter directement via REST API
      // Il faut utiliser le SQL Editor ou psql
      return { success: false, error: 'DDL commands must be executed via SQL Editor' };
    }
    
    // Pour les autres commandes (SELECT, INSERT, UPDATE, DELETE), on peut essayer
    // Mais même ça, Supabase REST API a des limitations
    
    return { success: false, error: 'SQL execution via REST API is limited. Please use SQL Editor.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Synchronisation auth.users → profiles\n');
  console.log('📡 Connexion à Supabase...\n');
  
  // Vérifier la connexion
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('✅ Connexion à Supabase réussie\n');
  } catch (error) {
    console.log('⚠️  Connexion vérifiée\n');
  }
  
  const sqlFile = path.join(__dirname, '../supabase/sync_auth_to_profiles.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${sqlFile}`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  // Diviser le SQL en blocs
  const blocks = splitSQLIntoBlocks(sql);
  console.log(`📝 ${blocks.length} blocs SQL trouvés\n`);
  
  console.log('⚠️  IMPORTANT: Supabase ne permet pas l\'exécution SQL arbitraire via REST API');
  console.log('📋 Les commandes DDL (CREATE, ALTER, DROP) doivent être exécutées via le SQL Editor\n');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 INSTRUCTIONS POUR L\'EXÉCUTION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('MÉTHODE 1: SQL Editor (Recommandé)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Ouvrez votre projet Supabase');
  console.log('2. Allez dans: SQL Editor > New Query');
  console.log('3. Copiez le contenu du fichier: supabase/sync_auth_to_profiles.sql');
  console.log('4. Collez-le dans l\'éditeur');
  console.log('5. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter\n');
  
  console.log('MÉTHODE 2: Via psql (si vous avez accès)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Récupérez votre connection string depuis Supabase Dashboard');
  console.log('2. Exécutez:');
  console.log(`   psql "[CONNECTION_STRING]" -f ${sqlFile}\n`);
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📄 CONTENU DU SCRIPT SQL');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(sql);
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  console.log('✅ Script préparé!');
  console.log('📝 Exécutez le script dans le SQL Editor de Supabase\n');
  
  // Essayer quand même d'afficher le contenu pour faciliter le copier-coller
  console.log('💡 Astuce: Le contenu complet est affiché ci-dessus pour faciliter le copier-coller\n');
}

// Exécuter
main().catch(console.error);

