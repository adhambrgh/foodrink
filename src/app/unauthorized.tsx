import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="text-center space-y-4">
        <ShieldX className="h-16 w-16 text-error mx-auto" />
        <h1 className="text-2xl font-bold text-text">Akses Ditolak</h1>
        <p className="text-text-muted">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}