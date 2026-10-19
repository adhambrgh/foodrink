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
    use HasFactory; // trait factory untuk pembuatan data testing

    protected $fillable = ['keranjang_id', 'product_id', 'jumlah']; // kolom yang boleh diisi mass-assignment

    protected function casts(): array // tentukan konversi tipe data kolom
    {
        return [
            'jumlah' => 'integer', // ubah jumlah menjadi angka bulat
        ];
    }

    public function keranjang(): BelongsTo // relasi balik ke keranjang induk
    {
        return $this->belongsTo(Keranjang::class); // item dimiliki satu keranjang
    }

    public function produk(): BelongsTo // relasi produk yang ada di item
    {
        // Foreign key ditulis eksplisit: kalau tidak, Eloquent menurunkannya
        // dari nama relasi jadi `produk_id`, sedangkan kolomnya `product_id`.
        return $this->belongsTo(Product::class, 'product_id'); // item menuju satu produk lewat product_id
    }

    /**
     * @return array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}
     */
    public function keBaris(): array // ubah item menjadi array untuk ditampilkan
    {
        return [
            'id' => $this->product_id, // ambil id produk
            'nama' => $this->produk->nama, // ambil nama produk
            'harga' => $this->produk->harga, // ambil harga produk terbaru
            'jumlah' => $this->jumlah, // ambil jumlah item yang dipilih
            'stok' => $this->produk->stok, // ambil stok produk terbaru
            'gambar' => $this->produk->foto_fallback, // ambil foto produk atau fallbacknya
        ];
    }
}
