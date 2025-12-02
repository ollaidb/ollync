import { supabase } from '../lib/supabaseClient'
import { getDefaultSubMenus } from './defaultSubMenus'

interface Category {
  id: string
}

export const fetchSubMenusForCategory = async (categorySlug: string): Promise<Array<{ name: string; slug: string }>> => {
  const defaultSubMenus = getDefaultSubMenus(categorySlug)
  
  try {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (categoryError || !category || !(category as Category).id) {
      return defaultSubMenus
    }

    const { data, error } = await supabase
      .from('sub_categories')
      .select('name, slug')
      .eq('category_id', (category as Category).id)
      .order('name')

    if (error || !data || data.length === 0) {
      return defaultSubMenus
    }

    return data
  } catch (error) {
    console.error('Error fetching submenus:', error)
    return defaultSubMenus
  }
}

