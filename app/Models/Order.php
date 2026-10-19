<?php

namespace App\Models;

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\StatusOrder;
use App\Enums\TingkatKelas;
use App\Support\KodePesanan;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory; // trait factory untuk pembuatan data testing

    public const CARA_AMBIL_ANTAR = 'antar'; // konstanta cara ambil diantar

    public const CARA_AMBIL_AMBIL = 'ambil'; // konstanta cara ambil sendiri

    public const BAYAR_QRIS = 'qris'; // konstanta metode bayar QRIS

    public const BAYAR_TUNAI = 'tunai'; // konstanta metode bayar tunai

    protected $fillable = [ // kolom yang boleh diisi mass-assignment
        'kode',
        'siswa_id',
        'nama',
        'tingkat',
        'jurusan',
        'kode_kelas',
        'ruang',
        'no_wa',
        'cara_ambil',
        'metode_bayar',
        'status',
        'total',
        'midtrans_order_id',
        'snap_token',
        'batas_bayar',
    ];

    protected function casts(): array // tentukan konversi tipe data kolom
    {
        return [
            'status' => StatusOrder::class, // ubah status jadi enum StatusOrder
            'tingkat' => TingkatKelas::class, // ubah tingkat jadi enum TingkatKelas
            'jurusan' => Jurusan::class, // ubah jurusan jadi enum Jurusan
            'kode_kelas' => KodeKelas::class, // ubah kode_kelas jadi enum KodeKelas
            'total' => 'integer', // ubah total jadi angka bulat
            'batas_bayar' => 'datetime', // ubah batas_bayar jadi objek tanggal
        ];
    }

    protected static function booted(): void // hook saat model di-boot
    {
        static::creating(function (Order $order) { // jalankan sebelum data dibuat
            $order->kode ??= KodePesanan::generateUnik(); // isi kode unik jika belum ada
        });
    }

    public function items(): HasMany // relasi daftar item pesanan
    {
        return $this->hasMany(OrderItem::class); // satu order punya banyak item
    }

    /**
     * Pembeli. Null hanya untuk order yang dibuat sebelum fitur akun siswa
     * ada -- order itu tetap utuh untuk laporan pendapatan, tapi tidak
     * milik siapa pun.
     */
    public function siswa(): BelongsTo // relasi ke pembeli
    {
        return $this->belongsTo(Siswa::class); // order dimiliki satu siswa
    }

    public function scopeStatus(Builder $query, array $statuses): Builder // saring order per status
    {
        return $query->whereIn('status', array_map( // filter whereIn untuk daftar status
            fn (StatusOrder $s) => $s->value, // ambil nilai string dari enum
            $statuses // sumber daftar status
        ));
    }

    /**
     * Order yang perlu tindakan admin: sudah dibayar tapi jajannya belum
     * diambil. Ini juga daftar default untuk halaman admin.
     */
    public function scopePerluDiproses(Builder $query): Builder // scope order yang perlu diproses admin
    {
        return $query->status([StatusOrder::Lunas]); // hanya status lunas
    }

    /**
     * Daftar kerja admin: apa pun yang sudah masuk proses sampai selesai.
     *
     * Bedanya dengan perluDiproses di sini bukan soal uang -- order tunai
     * masuk begitu pesanannya dibuat, karena yang perlu petugas lakukan sudah
     * jelas: antar lalu terima uangnya.
     */
    public function scopeRiwayatAdmin(Builder $query): Builder // scope riwayat kerja admin
    {
        return $query->status([StatusOrder::Lunas, StatusOrder::Selesai]); // status lunas dan selesai
    }

    public function scopeHariIni(Builder $query): Builder // scope order hari ini
    {
        return $query->where('created_at', '>=', now()->startOfDay()); // filter dari tengah malam hari ini
    }

    /**
     * Order yang uangnya sudah masuk. Ini satu-satunya sumber angka
     * pendapatan di dashboard admin.
     *
     * Non tunai:QrIS/VA/e-wallet masuk begitu Midtrans mengonfirmasi, jadi
     * status diproses saja sudah cukup dihitung. Tunai: uangnya baru ada
     * setelah petugas menekan Selesai, jadi order yang masih diproses tidak
     * boleh ikut lestari dihitung.
     */
    public function scopeTerbayar(Builder $query): Builder // scope order yang sudah terbayar
    {
        return $query->where(function (Builder $dalam) { // kelompokkan syarat dalam kurung
            $dalam->where('metode_bayar', self::BAYAR_QRIS) // syarat metode QRIS
                ->whereIn('status', [StatusOrder::Lunas, StatusOrder::Selesai]) // status lunas atau selesai
                ->orWhere('status', StatusOrder::Selesai); // atau tunai yang selesai
        });
    }

    public function scopePadaBulan(Builder $query, Carbon $bulan): Builder // saring order dalam satu bulan
    {
        return $query->whereBetween('created_at', [ // filter rentang tanggal dibuat
            $bulan->copy()->startOfMonth(), // batas awal bulan
            $bulan->copy()->endOfMonth(), // batas akhir bulan
        ]);
    }

    /**
     * Pendapatan per bulan, dikelompokkan dari tanggal pesanan. Nilai
     * `bulan` berformat YYYY-MM supaya aman dipakai sebagai key.
     *
     * @return Collection<int, object>
     */
    public static function pendapatanPerBulan(int $jumlahBulan = 12): Collection // hitung pendapatan per bulan
    {
        $awal = now()->startOfMonth()->subMonths($jumlahBulan - 1); // tanggal awal rentang bulan
        $akhir = now()->endOfMonth(); // tanggal akhir bulan berjalan

        return static::query() // mulai query order
            ->terbayar() // hanya order terbayar
            ->whereBetween('created_at', [$awal, $akhir]) // batasi rentang tanggal
            ->selectRaw(static::ekspresiBulan('created_at').' as bulan, SUM(total) as total, COUNT(*) as transaksi') // pilih bulan, total, jumlah transaksi
            ->groupByRaw(static::ekspresiBulan('created_at')) // kelompokkan per bulan
            ->orderBy('bulan') // urutkan menaik per bulan
            ->get(); // ambil hasil query
    }

    /**
     * MySQL dan SQLite punya format tanggal yang berbeda, jadi ekspresi
     * pengelompokan bulan dibuat sesuai driver yang dipakai.
     */
    protected static function ekspresiBulan(string $kolom): string // susun ekspresi format bulan
    {
        $driver = static::query()->getConnection()->getDriverName(); // ambil nama driver database

        return match ($driver) { // pilih ekspresi sesuai driver
            'sqlite' => "strftime('%Y-%m', {$kolom})", // format bulan SQLite
            'pgsql' => "to_char({$kolom}, 'YYYY-MM')", // format bulan PostgreSQL
            default => "DATE_FORMAT({$kolom}, '%Y-%m')", // format bulan MySQL
        };
    }

    public function getTotalRupiahAttribute(): string // accessor total format rupiah
    {
        return 'Rp '.number_format($this->total, 0, ',', '.'); // format total jadi rupiah
    }

    public function getJumlahItemAttribute(): int // accessor jumlah seluruh item
    {
        return (int) $this->items->sum('jumlah'); // jumlahkan kolom jumlah item
    }

    public function isDiantar(): bool // cek cara ambil diantar
    {
        return $this->cara_ambil === self::CARA_AMBIL_ANTAR; // bandingkan dengan konstanta antar
    }

    public function dibayarQris(): bool // cek metode bayar QRIS
    {
        return $this->metode_bayar === self::BAYAR_QRIS; // bandingkan dengan konstanta QRIS
    }

    /**
     * Order tunai: uang baru ada di tangan petugas saat jajan diantar,
     * bukan saat pesanan dibuat.
     */
    public function bayarTunai(): bool // cek metode bayar tunai
    {
        return $this->metode_bayar === self::BAYAR_TUNAI; // bandingkan dengan konstanta tunai
    }

    public function caraBayarLabel(): string // label cara bayar
    {
        // "Non tunai" terlalu kabur di struk: yang benar-benar dipindai
        // pembeli adalah QRIS-nya, jadi sebut apa adanya.
        return $this->bayarTunai() ? 'Tunai' : 'QRIS'; // pilih label tunai atau QRIS
    }

    public function bolehUbahKe(StatusOrder $target): bool // cek transisi status diizinkan
    {
        return in_array($target, $this->status->allowedTransitions(), true); // cek target ada di transisi valid
    }

    /**
     * Nomor WhatsApp untuk tampilan admin, diformat ulang ke gaya lokal.
     * Di database disimpan dalam format 62xxx.
     */
    public function getNoWaTampilAttribute(): string // accessor nomor WA tampilan
    {
        $nomor = (string) $this->no_wa; // ambil nomor WA sebagai string

        if (str_starts_with($nomor, '62')) { // jika diawali kode 62
            $nomor = '0'.substr($nomor, 2); // ubah jadi format lokal 08
        }

        $nomor = preg_replace('/\D/', '', $nomor) ?? ''; // buang semua karakter non-digit

        if ($nomor === '') { // jika nomor kosong
            return '-'; // kembalikan tanda kosong
        }

        return implode('-', str_split($nomor, 4)); // kelompokkan nomor tiap 4 digit
    }

    public function getCaraAmbilLabelAttribute(): string // accessor label cara ambil
    {
        return $this->isDiantar() ? 'Antar ke ruangan' : 'Ambil sendiri'; // pilih label antar atau ambil
    }

    /**
     * Ruangan tujuan antar, huruf besar semua supaya jelas di daftar
     * antrean admin. Kosong berarti data penerima belum terkirim.
     */
    public function getTujuanAntarAttribute(): string // accessor tujuan antar
    {
        $ruang = trim((string) $this->ruang); // bersihkan spasi nama ruang

        return $ruang === '' ? '-' : $ruang; // kembalikan ruang atau tanda kosong
    }

    /**
     * Kelas yang dipilih pembeli, disusun seperti yang they'dita: "X RPL A".
     * Bagian yang tidak diisi dilewati supaya tidak muncul spasi liar.
     */
    public function getKelasLengkapAttribute(): string // accessor kelas lengkap
    {
        return collect([ // kumpulkan bagian kelas
            $this->tingkat?->value, // nilai tingkat kelas
            $this->jurusan?->value, // nilai jurusan
            $this->kode_kelas?->value, // nilai kode kelas
        ])->filter()->implode(' '); // buang kosong lalu gabung spasi
    }

    /**
     * Label satu baris untuk daftar admin: kelas dulu, baru nama
     * ruangan kalau ada.
     */
    public function getTujuanLabelAttribute(): string // accessor label tujuan
    {
        $bagian = array_filter([ // kumpulkan bagian yang terisi
            $this->kelas_lengkap, // label kelas lengkap
            $this->tujuan_antar, // label ruangan tujuan
        ]);

        return $bagian === [] ? 'Tanpa data ruang' : implode(' · ', $bagian); // gabung atau beri label default
    }
}
