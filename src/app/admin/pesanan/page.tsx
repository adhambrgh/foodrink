import { getOrders } from '../menu/actions';
import { AdminPesananContent } from './page-content';

export default async function AdminPesananPage() {
  const { orders = [], error } = await getOrders();

  return <AdminPesananContent orders={orders as any[]} error={error} />;
}