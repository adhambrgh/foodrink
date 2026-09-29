<?php

namespace App\Models;

use App\Enums\StatusOrder;
use App\Support\KodePesanan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory;

    public const CARA_AMBIL_ANTAR = 'antar';

    public const CARA_AMBIL_AMBIL = 'ambil';

    public const BAYAR_QRIS = 'qris';

    public const BAYAR_TUNAI = 'tunai';

    protected $fillable = [
        'kode',
        'nama',
        'kelas',
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

    public function scopeStatus(Builder $query, array $statuses): Builder
    {
        return $query->whereIn('status', array_map(
            fn (StatusOrder $s) => $s->value,
            $statuses
        ));
    }

    /**
     * Order yang perlu tindakan admin: sudah dibayar tapi belum diantar/diambil.
     */
    public function scopePerluDiproses(Builder $query): Builder
    {
        return $query->status([StatusOrder::Dibuat, StatusOrder::Lunas]);
    }

    public function scopeHariIni(Builder $query): Builder
    {
        return $query->where('created_at', '>=', now()->startOfDay());
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
        return $this->isDiantar() ? 'Antar ke kelas' : 'Ambil sendiri';
    }
}
