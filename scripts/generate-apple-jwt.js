const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Informations Apple Developer
const TEAM_ID = 'WR5724DCAN';
const KEY_ID = 'CN6345M44T';
const BUNDLE_ID = 'com.ollync.mobile';

// Demander le chemin du fichier .p8
const p8FilePath = process.argv[2];

if (!p8FilePath) {
  console.error('❌ Erreur : Veuillez fournir le chemin vers votre fichier .p8');
  console.log('\nUsage: node scripts/generate-apple-jwt.js <chemin/vers/votre/key.p8>');
  console.log('\nExemple: node scripts/generate-apple-jwt.js ~/Downloads/AuthKey_CN6345M44T.p8');
  process.exit(1);
}

// Vérifier que le fichier existe
if (!fs.existsSync(p8FilePath)) {
  console.error(`❌ Erreur : Le fichier "${p8FilePath}" n'existe pas`);
  process.exit(1);
}

try {
  // Lire le fichier .p8
  const privateKey = fs.readFileSync(p8FilePath, 'utf8');
  
  // Vérifier que c'est bien une clé privée
  if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN EC PRIVATE KEY')) {
    console.error('❌ Erreur : Le fichier ne semble pas être une clé privée valide (.p8)');
    process.exit(1);
  }
  
  // Créer le JWT
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: TEAM_ID, // Team ID
      iat: now,
      exp: now + (86400 * 180), // Expire dans 6 mois (180 jours)
      aud: 'https://appleid.apple.com',
      sub: BUNDLE_ID // Bundle ID ou Services ID
    },
    privateKey,
    {
      algorithm: 'ES256',
      keyid: KEY_ID // Key ID
    }
  );
  
  console.log('\n✅ JWT généré avec succès !\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Copiez ce JWT dans le champ "Secret Key (for OAuth)" dans Supabase:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(token);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('ℹ️  Informations utilisées:');
  console.log(`   Team ID: ${TEAM_ID}`);
  console.log(`   Key ID: ${KEY_ID}`);
  console.log(`   Bundle ID: ${BUNDLE_ID}`);
  console.log(`   Expiration: ${new Date((now + (86400 * 180)) * 1000).toLocaleString()}\n`);
  
} catch (error) {
  console.error('❌ Erreur lors de la génération du JWT:');
  console.error(error.message);
  process.exit(1);
}

