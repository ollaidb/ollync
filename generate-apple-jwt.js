// Script pour générer un JWT Apple pour Supabase
// Usage: node generate-apple-jwt.js

const jwt = require('jsonwebtoken');

// ⚠️ CONFIGURATION - Remplacez ces valeurs si nécessaire
const TEAM_ID = 'WR5724DCAN';
const KEY_ID = 'CN6345M44T';
const CLIENT_ID = 'com.ollync.web'; // Services ID

// Private Key (votre clé .p8)
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg17Mn8XswNd62yLTU
wHzeHMMX3zarcHv+d2tI/kesCrOgCgYIKoZIzj0DAQehRANCAAT2gRIwo2xRJLwq
OWF6vOCzHUR8UwN1LWJQ1AoURnlkcx+15WEsm+RHlgEtR2M+q1EpHyy3Q3z5zsJ+
ynEHzAcj
-----END PRIVATE KEY-----`;

try {
  // Créer le payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: now + (86400 * 180), // 6 mois (180 jours)
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  };

  // Générer le JWT
  const token = jwt.sign(
    payload,
    PRIVATE_KEY,
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: KEY_ID
      }
    }
  );

  console.log('✅ JWT généré avec succès !\n');
  console.log('📋 Informations :');
  console.log(`   Team ID: ${TEAM_ID}`);
  console.log(`   Key ID: ${KEY_ID}`);
  console.log(`   Client ID: ${CLIENT_ID}`);
  console.log(`   Expiration: ${new Date((now + (86400 * 180)) * 1000).toISOString()}\n`);
  console.log('🔑 JWT (copiez ceci dans Supabase → Authentication → Providers → Apple → Secret Key) :\n');
  console.log(token);
  console.log('\n✅ Collez ce JWT dans Supabase et sauvegardez !');
} catch (error) {
  console.error('❌ Erreur lors de la génération du JWT :', error.message);
  console.error('\n💡 Assurez-vous d\'avoir installé jsonwebtoken :');
  console.error('   npm install jsonwebtoken');
  process.exit(1);
}
