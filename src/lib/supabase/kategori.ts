import { createAdminClient } from '@/lib/supabase/server-admin';

export async function getCategoriesWithCounts() {
  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, icon, active, sort_order')
    .eq('active', true)
    .order('sort_order')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  const counts = await Promise.all(
    categories.map(async (c) => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', c.id)
        .eq('is_active', true);

      return { id: c.id, productCount: count || 0 };
    })
  );

  return categories.map((c) => ({
    ...c,
    productCount: counts.find((x) => x.id === c.id)?.productCount || 0,
  }));
}
