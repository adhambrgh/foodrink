<?php

namespace App\Models;

use App\Enums\Kategori;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'nama',
        'slug',
        'deskripsi',
        'harga',
        'kategori',
        'gambar',
        'tersedia',
        'urutan',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'integer',
            'tersedia' => 'boolean',
            'urutan' => 'integer',
            'kategori' => Kategori::class,
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Product $produk) {
            if (blank($produk->slug)) {
                $produk->slug = static::slugDari($produk->nama, $produk->exists ? $produk->getKey() : null);
            }
        });
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeTersedia(Builder $query): Builder
    {
        return $query->where('tersedia', true);
    }

    /**
     * Urutan tampil: kolom urutan dulu, nama sebagai pemutus agar katalog
     * tidak berganti-ganti posisi kalau dua produk punya urutan sama.
     */
    public function scopeUrut(Builder $query): Builder
    {
        return $query->orderBy('urutan')->orderBy('nama');
    }

    public function scopeKategori(Builder $query, Kategori $kategori): Builder
    {
        return $query->where('kategori', $kategori->value);
    }

    /**
     * Harga dalam format Rupiah untuk ditampilkan.
     */
    public function getHargaRupiahAttribute(): string
    {
        return 'Rp '.number_format($this->harga, 0, ',', '.');
    }

    public function getUrlGambarAttribute(): ?string
    {
        return $this->gambar
            ? asset('storage/'.$this->gambar)
            : null;
    }

    /**
     * Slug unik dari nama produk. Nama duplikat mendapat akhiran angka
     * (mis. "pisang-nugget-original-2") supaya tidak bentrok di index unique.
     *
     * $abaikanId dipakai supaya produk yang sedang di-update tidak dianggap
     * bentrok dengan slug lamanya sendiri.
     */
    public static function slugDari(string $nama, ?int $abaikanId = null): string
    {
        $dasar = Str::slug($nama);

        if ($dasar === '') {
            $dasar = 'produk';
        }

        $slug = $dasar;
        $urutan = 2;

        $bentrok = static::query()
            ->where('slug', $slug)
            ->when($abaikanId !== null, fn (Builder $q) => $q->where('id', '!=', $abaikanId))
            ->exists();

        while ($bentrok) {
            $slug = $dasar.'-'.$urutan;
            $urutan++;

            $bentrok = static::query()
                ->where('slug', $slug)
                ->when($abaikanId !== null, fn (Builder $q) => $q->where('id', '!=', $abaikanId))
                ->exists();
        }

        return $slug;
    }
}
