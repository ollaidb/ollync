/**
 * Script d'installation automatique de la base de données
 * Exécute tous les scripts SQL dans Supabase
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration Supabase
const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
// NOTE: Vous devez ajouter votre clé service_role ici
// Vous pouvez la trouver dans: Supabase Dashboard > Settings > API > service_role key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERREUR: Clé service_role manquante!');
  console.log('\n📝 Pour obtenir votre clé service_role:');
  console.log('1. Allez sur https://supabase.com/dashboard');
  console.log('2. Sélectionnez votre projet');
  console.log('3. Allez dans Settings > API');
  console.log('4. Copiez la clé "service_role" (secret)');
  console.log('\nEnsuite, exécutez:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="votre-clé-service-role"');
  console.log('node scripts/install-database.js\n');
  process.exit(1);
}

/**
 * Exécute une requête SQL via l'API Supabase Management
 */
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const sqlQuery = encodeURIComponent(sql);
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql?query=${sqlQuery}`;
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    // Note: Supabase n'a pas d'endpoint direct pour exec_sql
    // Nous devons utiliser l'API Management différemment
    // Pour l'instant, utilisons une approche alternative
    
    console.log('⚠️  Supabase ne permet pas l\'exécution SQL directe via REST API');
    console.log('📋 Le script SQL a été préparé dans: supabase/INSTALLATION_COMPLETE.sql');
    console.log('\n✅ Solution: Exécutez le script manuellement dans le SQL Editor');
    console.log('1. Ouvrez https://supabase.com/dashboard');
    console.log('2. Allez dans SQL Editor');
    console.log('3. Copiez le contenu de supabase/INSTALLATION_COMPLETE.sql');
    console.log('4. Exécutez le script\n');
    
    resolve({ success: true, message: 'Script préparé' });
  });
}

/**
 * Lit un fichier SQL
 */
function readSQLFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Installation automatique de la base de données Ollync\n');
  
  const sqlFile = path.join(__dirname, '../supabase/INSTALLATION_COMPLETE.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`);
    process.exit(1);
  }
  
  console.log(`📖 Lecture du fichier: ${sqlFile}`);
  const sql = readSQLFile(sqlFile);
  
  if (!sql) {
    console.error('❌ Impossible de lire le fichier SQL');
    process.exit(1);
  }
  
  console.log(`✅ Fichier lu (${sql.length} caractères)\n`);
  
  // Diviser le SQL en commandes individuelles
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
  
  console.log(`📝 ${commands.length} commandes SQL trouvées\n`);
  
  // Note: Supabase Management API ne permet pas l'exécution SQL directe
  // Nous devons utiliser une autre approche
  console.log('⚠️  IMPORTANT: Supabase ne permet pas l\'exécution SQL arbitraire via REST API');
  console.log('📋 Le script complet est disponible dans: supabase/INSTALLATION_COMPLETE.sql\n');
  
  // Alternative: Créer un script qui utilise psql si disponible
  console.log('💡 Alternative: Utilisation de psql (si installé)\n');
  
  const psqlCommand = `psql "${SUPABASE_URL.replace('https://', 'postgresql://postgres:[YOUR-PASSWORD]@')}/postgres" -f ${sqlFile}`;
  
  console.log('📋 Pour exécuter avec psql, utilisez:');
  console.log(`   ${psqlCommand}\n`);
  console.log('   (Remplacez [YOUR-PASSWORD] par votre mot de passe de base de données)');
  console.log('   Vous pouvez trouver le mot de passe dans: Supabase Dashboard > Settings > Database\n');
  
  console.log('✅ Script d\'installation préparé!');
  console.log('📝 Exécutez le fichier supabase/INSTALLATION_COMPLETE.sql dans le SQL Editor de Supabase\n');
}

// Exécuter
main().catch(console.error);

