import { getCustomers } from './actions';
import { SendNotificationForm } from './send-notification-form';

export default async function AdminNotifikasiPage() {
  const customers = await getCustomers();

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Kirim Notifikasi</h1>
        <p className="text-sm text-text-muted mt-0.5">Kirim pesan ke semua customer atau satu customer</p>
      </div>
      <SendNotificationForm customers={customers} />
    </div>
  );
}