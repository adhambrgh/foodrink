<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StatusOrder;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * Daftar pesanan buat petugas: mana yang perlu diantar, mana yang sudah
 * selesai, mana yang batal.
 */
class PesananController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $valid = collect(StatusOrder::untukAdmin())
            ->first(fn (StatusOrder $s) => $s->name === $status);

        $pesanan = Order::with('items')
            // Yang masuk daftar kerja: sudah diproses atau sudah selesai.
            // Order tunai ikut di sini walau uangnya belum diterima --
            // mengantar jajan dan menerima uangnya tetap pekerjaan petugas.
            // Yang masih nunggu pembayaran atau dibatalkan tidak.
            ->riwayatAdmin()
            ->when($valid, fn ($query) => $query->where('status', $valid->value))
            ->when($q !== '', fn ($query) => $query->where(function ($inner) use ($q) {
                $inner->where('kode', 'like', "%{$q}%")
                    ->orWhere('nama', 'like', "%{$q}%")
                    ->orWhere('ruang', 'like', "%{$q}%");
            }))
            // Yang masih diproses dulu, baru yang sudah beres. FIELD() hanya
            // ada di MySQL, jadi urutannya pakai CASE yang portable.
            ->orderByRaw("CASE status
                WHEN 'lunas' THEN 1
                WHEN 'selesai' THEN 2
                ELSE 3 END")
            ->orderByDesc('created_at')
            // simplePaginate, bukan paginate: views-nya tidak butuh nomor
            // halaman, dan ini ikut jalur kueri yang sama untuk MySQL/SQLite.
            ->simplePaginate(20)
            ->withQueryString();

        $jumlah = Order::query()
            ->riwayatAdmin()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return view('admin.pesanan.index', [
            'pesanan' => $pesanan,
            'statusAktif' => $valid,
            'jumlah' => $jumlah,
            'q' => $q,
        ]);
    }

    /**
     * Pindahkan status pesanan. Aturan perpindahan tetap dipegang enum
     * StatusOrder, jadi admin tidak bisa mengarang status.
     */
    public function status(Request $request, Order $pesanan)
    {
        $data = $request->validate([
            'status' => ['required', 'string'],
        ]);

        $tujuan = StatusOrder::tryFrom($data['status']);

        if (! $tujuan) {
            return back()->with('galat', 'Status tidak dikenal.');
        }

        if (! $pesanan->bolehUbahKe($tujuan)) {
            return back()->with('galat', "Pesanan {$pesanan->kode} tidak bisa diubah jadi {$tujuan->label()}.");
        }

        $pesanan->update(['status' => $tujuan]);

        return back()->with('sukses', "Pesanan {$pesanan->kode} → {$tujuan->label()}.");
    }
}
