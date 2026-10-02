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
    use HasFactory;

    public const CARA_AMBIL_ANTAR = 'antar';

    public const CARA_AMBIL_AMBIL = 'ambil';

    public const BAYAR_QRIS = 'qris';

    public const BAYAR_TUNAI = 'tunai';

    protected $fillable = [
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

    protected function casts(): array
    {
        return [
            'status' => StatusOrder::class,
            'tingkat' => TingkatKelas::class,
            'jurusan' => Jurusan::class,
            'kode_kelas' => KodeKelas::class,
            'total' => 'integer',
            'batas_bayar' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $order->kode ??= KodePesanan::generateUnik();
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Pembeli. Null hanya untuk order yang dibuat sebelum fitur akun siswa
     * ada -- order itu tetap utuh untuk laporan pendapatan, tapi tidak
     * milik siapa pun.
     */
    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function scopeStatus(Builder $query, array $statuses): Builder
    {
        return $query->whereIn('status', array_map(
            fn (StatusOrder $s) => $s->value,
            $statuses
        ));
    }

    /**
     * Order yang perlu tindakan admin: sudah dibayar tapi jajannya belum
     * diambil. Ini juga daftar default untuk halaman admin.
     */
    public function scopePerluDiproses(Builder $query): Builder
    {
        return $query->status([StatusOrder::Lunas]);
    }

    /**
     * Daftar kerja admin: apa pun yang sudah masuk proses sampai selesai.
     *
     * Bedanya dengan perluDiproses di sini bukan soal uang -- order tunai
     * masuk begitu pesanannya dibuat, karena yang perlu petugas lakukan sudah
     * jelas: antar lalu terima uangnya.
     */
    public function scopeRiwayatAdmin(Builder $query): Builder
    {
        return $query->status([StatusOrder::Lunas, StatusOrder::Selesai]);
    }

    public function scopeHariIni(Builder $query): Builder
    {
        return $query->where('created_at', '>=', now()->startOfDay());
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
    public function scopeTerbayar(Builder $query): Builder
    {
        return $query->where(function (Builder $dalam) {
            $dalam->where('metode_bayar', self::BAYAR_QRIS)
                ->whereIn('status', [StatusOrder::Lunas, StatusOrder::Selesai])
                ->orWhere('status', StatusOrder::Selesai);
        });
    }

    public function scopePadaBulan(Builder $query, Carbon $bulan): Builder
    {
        return $query->whereBetween('created_at', [
            $bulan->copy()->startOfMonth(),
            $bulan->copy()->endOfMonth(),
        ]);
    }

    /**
     * Pendapatan per bulan, dikelompokkan dari tanggal pesanan. Nilai
     * `bulan` berformat YYYY-MM supaya aman dipakai sebagai key.
     *
     * @return Collection<int, object>
     */
    public static function pendapatanPerBulan(int $jumlahBulan = 12): Collection
    {
        $awal = now()->startOfMonth()->subMonths($jumlahBulan - 1);
        $akhir = now()->endOfMonth();

        return static::query()
            ->terbayar()
            ->whereBetween('created_at', [$awal, $akhir])
            ->selectRaw(static::ekspresiBulan('created_at').' as bulan, SUM(total) as total, COUNT(*) as transaksi')
            ->groupByRaw(static::ekspresiBulan('created_at'))
            ->orderBy('bulan')
            ->get();
    }

    /**
     * MySQL dan SQLite punya format tanggal yang berbeda, jadi ekspresi
     * pengelompokan bulan dibuat sesuai driver yang dipakai.
     */
    protected static function ekspresiBulan(string $kolom): string
    {
        $driver = static::query()->getConnection()->getDriverName();

        return match ($driver) {
            'sqlite' => "strftime('%Y-%m', {$kolom})",
            'pgsql' => "to_char({$kolom}, 'YYYY-MM')",
            default => "DATE_FORMAT({$kolom}, '%Y-%m')",
        };
    }

    public function getTotalRupiahAttribute(): string
    {
        return 'Rp '.number_format($this->total, 0, ',', '.');
    }

    public function getJumlahItemAttribute(): int
    {
        return (int) $this->items->sum('jumlah');
    }

    public function isDiantar(): bool
    {
        return $this->cara_ambil === self::CARA_AMBIL_ANTAR;
    }

    public function dibayarQris(): bool
    {
        return $this->metode_bayar === self::BAYAR_QRIS;
    }

    /**
     * Order tunai: uang baru ada di tangan petugas saat jajan diantar,
     * bukan saat pesanan dibuat.
     */
    public function bayarTunai(): bool
    {
        return $this->metode_bayar === self::BAYAR_TUNAI;
    }

    public function caraBayarLabel(): string
    {
        // "Non tunai" terlalu kabur di struk: yang benar-benar dipindai
        // pembeli adalah QRIS-nya, jadi sebut apa adanya.
        return $this->bayarTunai() ? 'Tunai' : 'QRIS';
    }

    public function bolehUbahKe(StatusOrder $target): bool
    {
        return in_array($target, $this->status->allowedTransitions(), true);
    }

    /**
     * Nomor WhatsApp untuk tampilan admin, diformat ulang ke gaya lokal.
     * Di database disimpan dalam format 62xxx.
     */
    public function getNoWaTampilAttribute(): string
    {
        $nomor = (string) $this->no_wa;

        if (str_starts_with($nomor, '62')) {
            $nomor = '0'.substr($nomor, 2);
        }

        $nomor = preg_replace('/\D/', '', $nomor) ?? '';

        if ($nomor === '') {
            return '-';
        }

        return implode('-', str_split($nomor, 4));
    }

    public function getCaraAmbilLabelAttribute(): string
    {
        return $this->isDiantar() ? 'Antar ke ruangan' : 'Ambil sendiri';
    }

    /**
     * Ruangan tujuan antar, huruf besar semua supaya jelas di daftar
     * antrean admin. Kosong berarti data penerima belum terkirim.
     */
    public function getTujuanAntarAttribute(): string
    {
        $ruang = trim((string) $this->ruang);

        return $ruang === '' ? '-' : $ruang;
    }

    /**
     * Kelas yang dipilih pembeli, disusun seperti yang they'dita: "X RPL A".
     * Bagian yang tidak diisi dilewati supaya tidak muncul spasi liar.
     */
    public function getKelasLengkapAttribute(): string
    {
        return collect([
            $this->tingkat?->value,
            $this->jurusan?->value,
            $this->kode_kelas?->value,
        ])->filter()->implode(' ');
    }

    /**
     * Label satu baris untuk daftar admin: kelas dulu, baru nama
     * ruangan kalau ada.
     */
    public function getTujuanLabelAttribute(): string
    {
        $bagian = array_filter([
            $this->kelas_lengkap,
            $this->tujuan_antar,
        ]);

        return $bagian === [] ? 'Tanpa data ruang' : implode(' · ', $bagian);
    }
}
