import { getProduct, getCategories } from '../../actions';
import { EditProductForm } from './edit-product-form';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    throw new Error('Produk tidak ditemukan');
  }

  const categories = await getCategories();

  return <EditProductForm categories={categories} product={product} />;
}