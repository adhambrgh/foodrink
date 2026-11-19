import { getAllUsersAdmin } from './actions';
import UserListClient from './user-list';

export default async function AdminUsersPage() {
  const { users, total, stats, error } = await getAllUsersAdmin({
    page: 1,
    pageSize: 20,
    activeThreshold: 7,
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text font-heading">Manajemen User</h1>
          <p className="text-sm text-text-muted">Kelola akun pelanggan & admin</p>
        </div>
      </header>

      {error ? (
        <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-sm text-error">
          Gagal memuat user: {error}
        </div>
      ) : (
        <UserListClient
          initialUsers={users}
          initialTotal={total}
          initialStats={stats}
          initialThreshold={7}
        />
      )}
    </div>
  );
}