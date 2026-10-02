<?php

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'nama',
        'harga',
        'jumlah',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'integer',
            'jumlah' => 'integer',
            'subtotal' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getSubtotalRupiahAttribute(): string
    {
        return 'Rp '.number_format($this->subtotal, 0, ',', '.');
    }

    public function getHargaRupiahAttribute(): string
    {
        return 'Rp '.number_format($this->harga, 0, ',', '.');
    }
}
