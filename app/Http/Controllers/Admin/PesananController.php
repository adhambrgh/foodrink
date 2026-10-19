<?php

namespace App\Http\Controllers\Admin; // namespace admin

use App\Enums\StatusOrder; // enum status order
use App\Http\Controllers\Controller; // kontroler induk
use App\Models\Order; // model order
use Illuminate\Http\Request; // request HTTP

/**
 * Daftar pesanan buat petugas: mana yang perlu diantar, mana yang sudah
 * selesai, mana yang batal.
 */
class PesananController extends Controller // kontroler pesanan admin
{
    public function index(Request $request) // daftar pesanan masuk
    {
        $status = $request->query('status'); // ambil filter status
        $q = trim((string) $request->query('q', '')); // ambil kata kunci pencarian

        $valid = collect(StatusOrder::untukAdmin()) // status yang boleh difilter
            ->first(fn (StatusOrder $s) => $s->name === $status); // cari yang cocok

        $pesanan = Order::with('items') // muat relasi item
            // Yang masuk daftar kerja: sudah diproses atau sudah selesai.
            // Order tunai ikut di sini walau uangnya belum diterima --
            // mengantar jajan dan menerima uangnya tetap pekerjaan petugas.
            // Yang masih nunggu pembayaran atau dibatalkan tidak.
            ->riwayatAdmin() // scope daftar kerja
            ->when($valid, fn ($query) => $query->where('status', $valid->value)) // filter status
            ->when($q !== '', fn ($query) => $query->where(function ($inner) use ($q) { // filter pencarian
                $inner->where('kode', 'like', "%{$q}%") // cari kode
                    ->orWhere('nama', 'like', "%{$q}%") // cari nama
                    ->orWhere('ruang', 'like', "%{$q}%"); // cari ruang
            }))
            // Yang masih diproses dulu, baru yang sudah beres. FIELD() hanya
            // ada di MySQL, jadi urutannya pakai CASE yang portable.
            ->orderByRaw("CASE status
                WHEN 'lunas' THEN 1
                WHEN 'selesai' THEN 2
                ELSE 3 END") // urut status proses dulu
            ->orderByDesc('created_at') // lalu terbaru
            // simplePaginate, bukan paginate: views-nya tidak butuh nomor
            // halaman, dan ini ikut jalur kueri yang sama untuk MySQL/SQLite.
            ->simplePaginate(20) // 20 per halaman
            ->withQueryString(); // pertahankan query string

        $jumlah = Order::query() // hitung per status
            ->riwayatAdmin() // scope daftar kerja
            ->selectRaw('status, count(*) as total') // count per status
            ->groupBy('status') // group status
            ->pluck('total', 'status'); // petakan jumlah

        return view('admin.pesanan.index', [ // render view daftar
            'pesanan' => $pesanan, // kirim data pesanan
            'statusAktif' => $valid, // kirim status aktif
            'jumlah' => $jumlah, // kirim jumlah per status
            'q' => $q, // kirim kata kunci
        ]);
    }

    /**
     * Pindahkan status pesanan. Aturan perpindahan tetap dipegang enum
     * StatusOrder, jadi admin tidak bisa mengarang status.
     */
    public function status(Request $request, Order $pesanan) // ubah status pesanan
    {
        $data = $request->validate([ // validasi input status
            'status' => ['required', 'string'], // status wajib
        ]);

        $tujuan = StatusOrder::tryFrom($data['status']); // cek enum valid

        if (! $tujuan) { // jika enum tidak dikenal
            return back()->with('galat', 'Status tidak dikenal.'); // tolak perubahan
        }

        if (! $pesanan->bolehUbahKe($tujuan)) { // cek aturan transisi
            return back()->with('galat', "Pesanan {$pesanan->kode} tidak bisa diubah jadi {$tujuan->label()}."); // tolak
        }

        $pesanan->update(['status' => $tujuan]); // simpan status baru

        return back()->with('sukses', "Pesanan {$pesanan->kode} → {$tujuan->label()}."); // pesan sukses
    }
}