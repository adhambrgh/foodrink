import { getOrders } from '../menu/actions';
import OrderList, { type Order } from './order-list';

export default async function AdminPesananPage() {
  const { orders = [], error } = await getOrders();

  return (
    <div className="w-full space-y-5 p-4 md:p-6">
      {error ? (
        <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">Gagal memuat pesanan: {error}</div>
      ) : (
        <OrderList orders={orders as Order[]} />
      )}
    </div>
  );
}
