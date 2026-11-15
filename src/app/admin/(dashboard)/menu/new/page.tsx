import { getCategories } from '../actions';
import { NewProductForm } from './new-product-form';

export default async function NewProductPage() {
  const categories = await getCategories();
  return <NewProductForm categories={categories} />;
}