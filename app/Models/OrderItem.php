<?php

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory; // trait factory untuk pembuatan data testing

    protected $fillable = [ // kolom yang boleh diisi mass-assignment
        'order_id',
        'product_id',
        'nama',
        'harga',
        'jumlah',
        'subtotal',
    ];

    protected function casts(): array // tentukan konversi tipe data kolom
    {
        return [
            'harga' => 'integer', // ubah harga jadi angka bulat
            'jumlah' => 'integer', // ubah jumlah jadi angka bulat
            'subtotal' => 'integer', // ubah subtotal jadi angka bulat
        ];
    }

    public function order(): BelongsTo // relasi balik ke order induk
    {
        return $this->belongsTo(Order::class); // item dimiliki satu order
    }

    public function product(): BelongsTo // relasi ke produk yang dipesan
    {
        return $this->belongsTo(Product::class); // item menuju satu produk
    }

    public function getSubtotalRupiahAttribute(): string // accessor subtotal format rupiah
    {
        return 'Rp '.number_format($this->subtotal, 0, ',', '.'); // format subtotal jadi rupiah
    }

    public function getHargaRupiahAttribute(): string // accessor harga format rupiah
    {
        return 'Rp '.number_format($this->harga, 0, ',', '.'); // format harga jadi rupiah
    }
}
