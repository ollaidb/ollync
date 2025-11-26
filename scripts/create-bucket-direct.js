/**
 * Script pour créer automatiquement le bucket Supabase Storage via l'API
 * Utilise l'API Supabase Management pour créer le bucket directement
 */

// Utiliser fetch natif (Node.js 18+)

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
  console.log('node scripts/create-bucket-direct.js\n');
  process.exit(1);
}

/**
 * Crée le bucket via l'API Supabase Management
 */
async function createBucket() {
  try {
    console.log('🚀 Création du bucket "posts" via l\'API Supabase...\n');
    
    // Utiliser l'API Management de Supabase pour créer le bucket
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/storage/buckets`;
    
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        id: 'posts',
        name: 'posts',
        public: true,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bucket "posts" créé avec succès!');
      console.log('📋 Détails:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('❌ Erreur lors de la création du bucket:', errorText);
      
      // Si le bucket existe déjà, c'est OK
      if (errorText.includes('already exists') || errorText.includes('duplicate')) {
        console.log('ℹ️  Le bucket existe déjà, c\'est parfait!');
        return { success: true, message: 'Bucket existe déjà' };
      }
      
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  const result = await createBucket();
  
  if (!result.success) {
    console.log('\n⚠️  La création automatique du bucket a échoué.');
    console.log('📋 Veuillez exécuter le script SQL manuellement dans le SQL Editor:\n');
    console.log('   supabase/fix_storage_and_profiles.sql\n');
  } else {
    console.log('\n✅ Le bucket a été créé ou existe déjà!');
    console.log('📋 Vous pouvez maintenant uploader des images dans vos annonces.\n');
  }
}

// Exécuter
main().catch(console.error);

