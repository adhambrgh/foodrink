<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Satu baris keranjang: satu produk dengan jumlah tertentu.
 *
 * Harga tidak disimpan di sini. Kalau disimpan, harga lama akan ikut
 * terbawa sampai checkout, dan itu sumber kesalahan yang klasik.
 * Harga selalu diambil dari produk saat dipakai.
 */
class KeranjangItem extends Model
{
    /** @use HasFactory<KeranjangItemFactory> */
    use HasFactory;

    protected $fillable = ['keranjang_id', 'product_id', 'jumlah'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'integer',
        ];
    }

    public function keranjang(): BelongsTo
    {
        return $this->belongsTo(Keranjang::class);
    }

    public function produk(): BelongsTo
    {
        // Foreign key ditulis eksplisit: kalau tidak, Eloquent menurunkannya
        // dari nama relasi jadi `produk_id`, sedangkan kolomnya `product_id`.
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}
     */
    public function keBaris(): array
    {
        return [
            'id' => $this->product_id,
            'nama' => $this->produk->nama,
            'harga' => $this->produk->harga,
            'jumlah' => $this->jumlah,
            'stok' => $this->produk->stok,
            'gambar' => $this->produk->foto_fallback,
        ];
    }
}
