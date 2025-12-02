import { supabase } from '../lib/supabaseClient';
import { mapPosts } from './postMapper';

export async function fetchPostsWithRelations(options = {}) {
  const {
    categoryId,
    subCategoryId,
    userId,
    status = 'active',
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;

  try {
    // 1. Récupérer les posts
    let query = supabase
      .from('posts')
      .select('*')
      .eq('status', status);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (subCategoryId) {
      query = query.eq('sub_category_id', subCategoryId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      // Vérifier si c'est une erreur réseau
      if (postsError.message?.includes('Failed to fetch') || 
          postsError.message?.includes('NetworkError') ||
          postsError.message?.includes('network')) {
        throw new Error('Erreur de connexion réseau. Vérifiez votre connexion internet.');
      }
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // 2. Récupérer les IDs uniques
    const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
    const categoryIds = [...new Set(posts.map((p) => p.category_id).filter(Boolean))];

    // 3. Récupérer les profils
    const profilesMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (!profilesError && profiles) {
        profiles.forEach((profile) => {
          profilesMap.set(profile.id, profile);
        });
      }
    }

    // 4. Récupérer les catégories
    const categoriesMap = new Map();
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .in('id', categoryIds);

      if (!categoriesError && categories) {
        categories.forEach((category) => {
          categoriesMap.set(category.id, category);
        });
      }
    }

    // 5. Combiner les données
    const postsWithRelations = posts.map((post) => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || null,
      categories: categoriesMap.get(post.category_id) || null
    }));

    // 6. Mapper vers le format attendu
    return mapPosts(postsWithRelations);
  } catch (error) {
    console.error('Error in fetchPostsWithRelations:', error);
    // Propager les erreurs réseau pour qu'elles soient gérées par les composants
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('network'))) {
      throw error;
    }
    return [];
  }
}

