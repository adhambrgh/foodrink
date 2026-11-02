import { createAdminClient } from '@/lib/supabase/server-admin';
import { getCategories as getActiveCategories } from '@/app/admin/menu/actions';
import { EditCategoryForm } from './edit-category-form';
import { notFound } from 'next/navigation';

async function getCategory(id: string) {
  const supabase = createAdminClient();
  const { data: category } = await supabase.from('categories').select('*').eq('id', id).single();
  return category;
}

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) notFound();

  const categories = await getActiveCategories();

  return <EditCategoryForm categories={categories} category={category} />;
}