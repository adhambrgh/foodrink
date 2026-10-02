<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\View\View;

/**
 * Laporan rekapitulasi omzet penjualan per bulan dan grafik tren.
 * Sumber angka hanya mengambil pesanan yang uangnya sudah pasti masuk (scope `terbayar`).
 */
class PendapatanController extends Controller
{
    private const BULAN_DIPILIH = 'bulan';

    private const JUMLAH_BULAN_TAMPILAN = 12;

    /**
     * Nama bulan ditulis manual, bukan lewat translatedFormat, supaya
     * halaman ini tetap Bahasa Indonesia tanpa mengubah locale aplikasi
     * yang dipakai untuk pesan validasi.
     */
    private const NAMA_BULAN = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function index(Request $request): View
    {
        $bulan = $this->bulanDipilih($request);

        $riwayat = Order::pendapatanPerBulan(self::JUMLAH_BULAN_TAMPILAN)
            ->keyBy('bulan');

        $detail = Order::query()
            ->terbayar()
            ->padaBulan($bulan)
            ->with('items')
            ->orderByDesc('created_at')
            ->get();

        return view('admin.pendapatan.index', [
            'bulan' => $bulan,
            'labelBulan' => self::NAMA_BULAN[$bulan->month].' '.$bulan->format('Y'),
            'daftarBulan' => $this->daftarBulan(),
            'riwayat' => $riwayat,
            'grafik' => $this->grafik($riwayat),
            'pesanan' => $detail,
            'totalBulan' => (int) $detail->sum('total'),
            'transaksiBulan' => $detail->count(),
            'itemBulan' => (int) $detail->sum(fn (Order $o) => $o->jumlah_item),
            'rataPerHari' => $this->rataPerHari($detail, $bulan),
            'produkTerlaris' => $this->produkTerlaris($bulan),
            'totalTahun' => (int) $riwayat->where('bulan', '>=', $bulan->copy()->startOfYear()->format('Y-m'))->sum('total'),
            'pendapatanHariIni' => (int) Order::query()->terbayar()->hariIni()->sum('total'),
            'rataBulanIni' => $this->rataBulan($riwayat, $bulan),
            'bulanTerbaik' => $this->bulanTerbaik($riwayat),
        ]);
    }

    /**
     * Bulan yang dipilih user, default ke bulan ini. Format YYYY-MM; input
     * lain diabaikan supaya URL rusak tidak bikin error.
     */
    private function bulanDipilih(Request $request): Carbon
    {
        $bulan = trim((string) $request->query(self::BULAN_DIPILIH, ''));

        if (preg_match('/^\d{4}-\d{2}$/', $bulan) === 1) {
            try {
                return Carbon::createFromFormat('Y-m-d', $bulan.'-01')->startOfMonth();
            } catch (\Throwable) {
                // Formatnya benar tapi isinya tidak tanggal, mis. 2026-99.
            }
        }

        return now()->startOfMonth();
    }

    /**
     * Opsi dropdown: 18 bulan ke belakang sampai bulan depan, supaya admin
     * bisa melihat bulan yang belum berisi apa-apa.
     *
     * @return array<string, string>
     */
    private function daftarBulan(): array
    {
        $daftar = [];

        for ($i = -17; $i <= 1; $i++) {
            $bulan = now()->startOfMonth()->addMonths($i);
            $daftar[$bulan->format('Y-m')] = self::NAMA_BULAN[$bulan->month].' '.$bulan->format('Y');
        }

        return $daftar;
    }

    /**
     * 12 bulan terakhir sesuai urutan kronologis, bulan tanpa transaksi
     * tetap diisi dengan nol supaya grafiknya tidak bolong.
     *
     * @param  Collection<string, object>  $riwayat
     * @return array<int, array<string, mixed>>
     */
    private function grafik($riwayat): array
    {
        $hasil = [];
        $terbesar = 1;

        for ($i = self::JUMLAH_BULAN_TAMPILAN - 1; $i >= 0; $i--) {
            $bulan = now()->startOfMonth()->subMonths($i);
            $kunci = $bulan->format('Y-m');
            $total = (int) ($riwayat[$kunci]->total ?? 0);

            $terbesar = max($terbesar, $total);

            $hasil[] = [
                'label' => $bulan->format('M'),
                'labelLengkap' => self::NAMA_BULAN[$bulan->month].' '.$bulan->format('Y'),
                'total' => $total,
                'transaksi' => (int) ($riwayat[$kunci]->transaksi ?? 0),
                'persen' => 0,
            ];
        }

        foreach ($hasil as $i => $bar) {
            $hasil[$i]['persen'] = $bar['total'] > 0
                ? round($bar['total'] / $terbesar * 100, 1)
                : 0;
        }

        return $hasil;
    }

    /**
     * Rata-rata pendapatan per hari aktif sampai hari ini, bukan dibagi 30
     * -- supaya bulan yang baru dimulai tidak terlihat jelek.
     *
     * @param  Collection<int, Order>  $pesanan
     */
    private function rataPerHari($pesanan, Carbon $bulan): int
    {
        $jumlahHari = $bulan->isFuture()
            ? 1
            : ($bulan->isSameMonth(now()) ? now()->day : $bulan->daysInMonth);

        return (int) round($pesanan->sum('total') / max(1, $jumlahHari));
    }

    /**
     * Rata-rata dari bulan-bulan tahun ini yang punya transaksi, supaya
     * bulan kosong tidak ikut menurunkan rata-rata.
     *
     * @param  Collection<string, object>  $riwayat
     */
    private function rataBulan($riwayat, Carbon $bulan): int
    {
        $tahun = $bulan->format('Y');

        $adaTransaksi = $riwayat->filter(
            fn ($baris, $kunci) => str_starts_with((string) $kunci, $tahun) && (int) $baris->transaksi > 0
        );

        if ($adaTransaksi->isEmpty()) {
            return 0;
        }

        return (int) round($adaTransaksi->sum('total') / $adaTransaksi->count());
    }

    /**
     * @param  Collection<string, object>  $riwayat
     */
    private function bulanTerbaik($riwayat): ?object
    {
        $terbaik = $riwayat
            ->filter(fn ($baris) => (int) $baris->transaksi > 0)
            ->sortByDesc('total')
            ->first();

        if (! $terbaik) {
            return null;
        }

        return (object) [
            'label' => self::NAMA_BULAN[(int) substr((string) $terbaik->bulan, 5, 2)].' '.substr((string) $terbaik->bulan, 0, 4),
            'total' => (int) $terbaik->total,
            'transaksi' => (int) $terbaik->transaksi,
        ];
    }

    /**
     * @return Collection<int, object>
     */
    private function produkTerlaris(Carbon $bulan)
    {
        return OrderItem::query()
            ->whereHas('order', fn ($q) => $q->terbayar()->padaBulan($bulan))
            ->selectRaw('nama, product_id, SUM(jumlah) as terjual, SUM(subtotal) as omzet')
            ->groupBy('nama', 'product_id')
            ->orderByDesc('terjual')
            ->limit(8)
            ->get();
    }
}
