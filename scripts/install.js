#!/usr/bin/env node

/**
 * Script maître d'installation de la base de données Ollync
 * Propose trois méthodes d'installation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SQL_FILE = path.join(__dirname, '../supabase/INSTALLATION_COMPLETE.sql');

// Créer l'interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  const method = args[0];
  
  if (method === 'editor' || method === '1') {
    await methodSQLEditor();
    rl.close();
    return;
  }
  
  if (method === 'psql' || method === '2') {
    await methodPsql();
    rl.close();
    return;
  }
  
  if (method === 'api' || method === '3') {
    await methodAPI();
    rl.close();
    return;
  }
  
  // Mode interactif si aucune méthode spécifiée
  console.log('🚀 Installation de la base de données Ollync\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 MÉTHODES D\'INSTALLATION DISPONIBLES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('1. 📝 SQL Editor (Recommandé - Le plus simple)');
  console.log('   → Affiche le SQL pour copier-coller dans Supabase');
  console.log('   → Commande: npm run install-db:editor\n');
  
  console.log('2. 🔧 Via psql (Ligne de commande)');
  console.log('   → Exécute le SQL directement via PostgreSQL');
  console.log('   → Commande: npm run install-db:psql\n');
  
  console.log('3. 🤖 Tentative automatique via API');
  console.log('   → Essaie d\'exécuter via l\'API Supabase');
  console.log('   → Commande: npm run install-db:api\n');
  
  const choice = await question('Choisissez une méthode (1, 2 ou 3): ');
  
  console.log('\n');
  
  switch (choice.trim()) {
    case '1':
      await methodSQLEditor();
      break;
    case '2':
      await methodPsql();
      break;
    case '3':
      await methodAPI();
      break;
    default:
      console.log('❌ Choix invalide');
      process.exit(1);
  }
  
  rl.close();
}

async function methodSQLEditor() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 MÉTHODE 1: SQL Editor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ Fichier non trouvé: ${SQL_FILE}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  
  console.log('📋 Instructions:');
  console.log('1. Ouvrez: https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new');
  console.log('2. Le contenu du fichier SQL sera affiché ci-dessous');
  console.log('3. Copiez tout le contenu et collez-le dans le SQL Editor');
  console.log('4. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter\n');
  
  console.log('─'.repeat(60));
  console.log('📄 CONTENU DU FICHIER SQL:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n✅ Copiez le contenu ci-dessus dans le SQL Editor de Supabase\n');
}

async function methodPsql() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 MÉTHODE 2: Via psql');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Vérifier si psql est installé
  try {
    execSync('which psql', { stdio: 'ignore' });
  } catch (error) {
    console.log('❌ psql n\'est pas installé');
    console.log('📝 Installez PostgreSQL:');
    console.log('   macOS: brew install postgresql');
    console.log('   Linux: sudo apt-get install postgresql-client\n');
    process.exit(1);
  }
  
  console.log('📝 Entrez le mot de passe de votre base de données Supabase:');
  console.log('   (Vous pouvez le trouver dans: Supabase Dashboard > Settings > Database)\n');
  
  const password = await question('Mot de passe: ');
  
  if (!password) {
    console.log('❌ Mot de passe requis');
    process.exit(1);
  }
  
  console.log('\n📖 Exécution du script SQL...\n');
  
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const dbUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
  
  try {
    execSync(`psql "${dbUrl}" -f "${SQL_FILE}"`, { 
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: password }
    });
    console.log('\n✅ Installation terminée avec succès!\n');
  } catch (error) {
    console.log('\n❌ Erreur lors de l\'installation');
    console.log('💡 Vérifiez que le mot de passe est correct\n');
    process.exit(1);
  }
}

async function methodAPI() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 MÉTHODE 3: Tentative automatique via API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!serviceRoleKey) {
    console.log('❌ Clé service_role manquante!');
    console.log('📝 Pour obtenir votre clé service_role:');
    console.log('1. Allez sur https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq');
    console.log('2. Allez dans Settings > API');
    console.log('3. Copiez la clé "service_role" (secret)');
    console.log('\nEnsuite, exécutez:');
    console.log('export SUPABASE_SERVICE_ROLE_KEY="votre-clé-service-role"');
    console.log('node scripts/install.js\n');
    process.exit(1);
  }
  
  console.log('📝 Exécution du script auto-install.js...\n');
  
  try {
    execSync('node scripts/auto-install.js', { 
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey }
    });
  } catch (error) {
    console.log('\n⚠️  L\'exécution automatique n\'a pas fonctionné');
    console.log('💡 Utilisez la méthode 1 (SQL Editor) ou la méthode 2 (psql)\n');
  }
}

main().catch(console.error);

