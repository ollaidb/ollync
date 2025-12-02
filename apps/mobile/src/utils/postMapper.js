export function mapPost(post) {
  return {
    ...post,
    is_urgent: post.is_urgent ?? false,
    user: post.profiles || null,
    category: post.categories || null
  };
}

export function mapPosts(posts) {
  return posts.map(mapPost);
}

