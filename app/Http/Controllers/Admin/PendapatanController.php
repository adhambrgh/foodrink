<?php

namespace App\Http\Controllers\Admin; // namespace admin

use App\Http\Controllers\Controller; // kontroler induk
use App\Models\Order; // model order
use App\Models\OrderItem; // model item order
use Illuminate\Http\Request; // request HTTP
use Illuminate\Support\Carbon; // helper Carbon
use Illuminate\Support\Collection; // koleksi data
use Illuminate\View\View; // view response

/**
 * Laporan rekapitulasi omzet penjualan per bulan dan grafik tren.
 * Sumber angka hanya mengambil pesanan yang uangnya sudah pasti masuk (scope `terbayar`).
 */
class PendapatanController extends Controller // kontroler laporan pendapatan
{
    private const BULAN_DIPILIH = 'bulan'; // kunci query bulan

    private const JUMLAH_BULAN_TAMPILAN = 12; // jumlah bulan tampil

    /**
     * Nama bulan ditulis manual, bukan lewat translatedFormat, supaya
     * halaman ini tetap Bahasa Indonesia tanpa mengubah locale aplikasi
     * yang dipakai untuk pesan validasi.
     */
    private const NAMA_BULAN = [ // peta nama bulan Indonesia
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', // bulan 1-4
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', // bulan 5-8
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember', // bulan 9-12
    ];

    public function index(Request $request): View // tampilkan laporan pendapatan
    {
        $bulan = $this->bulanDipilih($request); // tentukan bulan dipilih

        $riwayat = Order::pendapatanPerBulan(self::JUMLAH_BULAN_TAMPILAN) // ambil rekap bulanan
            ->keyBy('bulan'); // key berdasarkan bulan

        $detail = Order::query() // query detail transaksi
            ->terbayar() // hanya yang terbayar
            ->padaBulan($bulan) // filter bulan dipilih
            ->with('items') // sertakan item order
            ->orderByDesc('created_at') // urut terbaru
            ->get(); // ambil semua

        return view('admin.pendapatan.index', [ // render view laporan
            'bulan' => $bulan, // bulan aktif
            'labelBulan' => self::NAMA_BULAN[$bulan->month].' '.$bulan->format('Y'), // label bulan Indonesia
            'daftarBulan' => $this->daftarBulan(), // opsi dropdown bulan
            'riwayat' => $riwayat, // riwayat bulanan
            'grafik' => $this->grafik($riwayat), // data grafik
            'pesanan' => $detail, // detail pesanan
            'totalBulan' => (int) $detail->sum('total'), // total omzet bulan
            'transaksiBulan' => $detail->count(), // jumlah transaksi
            'itemBulan' => (int) $detail->sum(fn (Order $o) => $o->jumlah_item), // jumlah item terjual
            'rataPerHari' => $this->rataPerHari($detail, $bulan), // rata harian
            'produkTerlaris' => $this->produkTerlaris($bulan), // produk terlaris
            'totalTahun' => (int) $riwayat->where('bulan', '>=', $bulan->copy()->startOfYear()->format('Y-m'))->sum('total'), // total tahun berjalan
            'pendapatanHariIni' => (int) Order::query()->terbayar()->hariIni()->sum('total'), // omzet hari ini
            'rataBulanIni' => $this->rataBulan($riwayat, $bulan), // rata bulanan
            'bulanTerbaik' => $this->bulanTerbaik($riwayat), // bulan terbaik
        ]);
    }

    /**
     * Bulan yang dipilih user, default ke bulan ini. Format YYYY-MM; input
     * lain diabaikan supaya URL rusak tidak bikin error.
     */
    private function bulanDipilih(Request $request): Carbon // parsing bulan dari URL
    {
        $bulan = trim((string) $request->query(self::BULAN_DIPILIH, '')); // ambil query bulan

        if (preg_match('/^\d{4}-\d{2}$/', $bulan) === 1) { // cek format YYYY-MM
            try { // coba parsing tanggal
                return Carbon::createFromFormat('Y-m-d', $bulan.'-01')->startOfMonth(); // awal bulan dipilih
            } catch (\Throwable) { // tangkap tanggal invalid
                // Formatnya benar tapi isinya tidak tanggal, mis. 2026-99.
            }
        }

        return now()->startOfMonth(); // default bulan berjalan
    }

    /**
     * Opsi dropdown: 18 bulan ke belakang sampai bulan depan, supaya admin
     * bisa melihat bulan yang belum berisi apa-apa.
     *
     * @return array<string, string>
     */
    private function daftarBulan(): array // susun opsi dropdown bulan
    {
        $daftar = []; // wadah daftar

        for ($i = -17; $i <= 1; $i++) { // loop 17 mundur 1 maju
            $bulan = now()->startOfMonth()->addMonths($i); // geser bulan
            $daftar[$bulan->format('Y-m')] = self::NAMA_BULAN[$bulan->month].' '.$bulan->format('Y'); // label Indonesia
        }

        return $daftar; // kembalikan daftar
    }

    /**
     * 12 bulan terakhir sesuai urutan kronologis, bulan tanpa transaksi
     * tetap diisi dengan nol supaya grafiknya tidak bolong.
     *
     * @param  Collection<string, object>  $riwayat
     * @return array<int, array<string, mixed>>
     */
    private function grafik($riwayat): array // susun data grafik
    {
        $hasil = []; // wadah hasil grafik
        $terbesar = 1; // nilai terbesar awal

        for ($i = self::JUMLAH_BULAN_TAMPILAN - 1; $i >= 0; $i--) { // loop 12 bulan
            $bulan = now()->startOfMonth()->subMonths($i); // hitung bulan mundur
            $kunci = $bulan->format('Y-m'); // kunci Y-m
            $total = (int) ($riwayat[$kunci]->total ?? 0); // total bulan ini

            $terbesar = max($terbesar, $total); // update nilai terbesar

            $hasil[] = [ // tambah bar grafik
                'label' => $bulan->format('M'), // label pendek
                'labelLengkap' => self::NAMA_BULAN[$bulan->month].' '.$bulan->format('Y'), // label lengkap
                'total' => $total, // total omzet
                'transaksi' => (int) ($riwayat[$kunci]->transaksi ?? 0), // jumlah transaksi
                'persen' => 0, // persen awal nol
            ];
        }

        foreach ($hasil as $i => $bar) { // hitung persen tiap bar
            $hasil[$i]['persen'] = $bar['total'] > 0 // cek ada total
                ? round($bar['total'] / $terbesar * 100, 1) // persen relatif terbesar
                : 0; // nol jika kosong
        }

        return $hasil; // kembalikan grafik
    }

    /**
     * Rata-rata pendapatan per hari aktif sampai hari ini, bukan dibagi 30
     * -- supaya bulan yang baru dimulai tidak terlihat jelek.
     *
     * @param  Collection<int, Order>  $pesanan
     */
    private function rataPerHari($pesanan, Carbon $bulan): int // hitung rata harian
    {
        $jumlahHari = $bulan->isFuture() // cek bulan masa depan
            ? 1 // bagi satu hari
            : ($bulan->isSameMonth(now()) ? now()->day : $bulan->daysInMonth); // hari berjalan/penuh

        return (int) round($pesanan->sum('total') / max(1, $jumlahHari)); // bagi total hari
    }

    /**
     * Rata-rata dari bulan-bulan tahun ini yang punya transaksi, supaya
     * bulan kosong tidak ikut menurunkan rata-rata.
     *
     * @param  Collection<string, object>  $riwayat
     */
    private function rataBulan($riwayat, Carbon $bulan): int // hitung rata bulanan
    {
        $tahun = $bulan->format('Y'); // ambil tahun aktif

        $adaTransaksi = $riwayat->filter( // filter bulan bertransaksi
            fn ($baris, $kunci) => str_starts_with((string) $kunci, $tahun) && (int) $baris->transaksi > 0 // tahun sama dan ada transaksi
        );

        if ($adaTransaksi->isEmpty()) { // cek tidak ada transaksi
            return 0; // kembalikan nol
        }

        return (int) round($adaTransaksi->sum('total') / $adaTransaksi->count()); // rata-rata terisi
    }

    /**
     * @param  Collection<string, object>  $riwayat
     */
    private function bulanTerbaik($riwayat): ?object // cari bulan terbaik
    {
        $terbaik = $riwayat // dari riwayat
            ->filter(fn ($baris) => (int) $baris->transaksi > 0) // hanya bertransaksi
            ->sortByDesc('total') // urut total terbesar
            ->first(); // ambil pertama

        if (! $terbaik) { // cek tidak ada
            return null; // kembalikan null
        }

        return (object) [ // bungkus hasil terbaik
            'label' => self::NAMA_BULAN[(int) substr((string) $terbaik->bulan, 5, 2)].' '.substr((string) $terbaik->bulan, 0, 4), // label Indonesia
            'total' => (int) $terbaik->total, // total omzet
            'transaksi' => (int) $terbaik->transaksi, // jumlah transaksi
        ];
    }

    /**
     * @return Collection<int, object>
     */
    private function produkTerlaris(Carbon $bulan) // top produk laris
    {
        return OrderItem::query() // query item order
            ->whereHas('order', fn ($q) => $q->terbayar()->padaBulan($bulan)) // hanya terbayar bulan ini
            ->selectRaw('nama, product_id, SUM(jumlah) as terjual, SUM(subtotal) as omzet') // agregat terjual omzet
            ->groupBy('nama', 'product_id') // group per produk
            ->orderByDesc('terjual') // urut terlaris
            ->limit(8) // ambil 8 besar
            ->get(); // eksekusi query
    }
}