/**
 * Script de test pour vérifier les requêtes de posts
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://abmtxvyycslskmnmlniq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibXR4dnl5Y3Nsc2ttbm1sbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTAyNDYsImV4cCI6MjA2Mzg2NjI0Nn0.oUz9VQxd5waFJ6Hoj1c5AcvrcqnqYnGYa6iMTUOYumU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQueries() {
  console.log('🧪 Test des requêtes de posts\n');

  // Test 1: Requête simple sans relations
  console.log('1️⃣ Test: Requête simple sans relations');
  const { data: simpleData, error: simpleError } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'active')
    .limit(5);

  if (simpleError) {
    console.error('❌ Erreur:', simpleError.message);
  } else {
    console.log(`✅ ${simpleData?.length || 0} posts trouvés`);
    if (simpleData && simpleData.length > 0) {
      console.log('   Premier post:', {
        id: simpleData[0].id,
        title: simpleData[0].title,
        user_id: simpleData[0].user_id,
        category_id: simpleData[0].category_id
      });
    }
  }

  // Test 2: Requête avec relation profiles (syntaxe 1)
  console.log('\n2️⃣ Test: Requête avec profiles (syntaxe posts_user_id_fkey)');
  const { data: data1, error: error1 } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey(username, full_name, avatar_url)
    `)
    .eq('status', 'active')
    .limit(5);

  if (error1) {
    console.error('❌ Erreur:', error1.message);
    console.error('   Code:', error1.code);
    console.error('   Details:', error1.details);
  } else {
    console.log(`✅ ${data1?.length || 0} posts trouvés`);
  }

  // Test 3: Requête avec relation profiles (syntaxe 2 - sans nom de contrainte)
  console.log('\n3️⃣ Test: Requête avec profiles (syntaxe sans nom de contrainte)');
  const { data: data2, error: error2 } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(username, full_name, avatar_url)
    `)
    .eq('status', 'active')
    .limit(5);

  if (error2) {
    console.error('❌ Erreur:', error2.message);
  } else {
    console.log(`✅ ${data2?.length || 0} posts trouvés`);
    if (data2 && data2.length > 0) {
      console.log('   Premier post avec user:', {
        id: data2[0].id,
        title: data2[0].title,
        profiles: data2[0].profiles
      });
    }
  }

  // Test 4: Requête avec relation profiles (syntaxe 3 - avec user_id)
  console.log('\n4️⃣ Test: Requête avec profiles (syntaxe avec user_id)');
  const { data: data3, error: error3 } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!inner(username, full_name, avatar_url)
    `)
    .eq('status', 'active')
    .limit(5);

  if (error3) {
    console.error('❌ Erreur:', error3.message);
  } else {
    console.log(`✅ ${data3?.length || 0} posts trouvés`);
  }

  // Test 5: Vérifier les contraintes de clés étrangères
  console.log('\n5️⃣ Test: Vérification des contraintes');
  const { data: constraints, error: constraintsError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          conname as constraint_name,
          conrelid::regclass as table_name,
          confrelid::regclass as foreign_table
        FROM pg_constraint
        WHERE conrelid = 'posts'::regclass
        AND contype = 'f'
      `
    });

  if (constraintsError) {
    console.log('⚠️  Impossible de vérifier les contraintes (normal si la fonction n\'existe pas)');
  } else {
    console.log('Contraintes trouvées:', constraints);
  }
}

testQueries().catch(console.error);

