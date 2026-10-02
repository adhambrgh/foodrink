<?php

namespace App\Models;

use App\Enums\Kategori;
use App\Support\GambarBawaan;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'nama',
        'slug',
        'deskripsi',
        'harga',
        'stok',
        'kategori',
        'gambar',
        'tersedia',
        'urutan',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'integer',
            'stok' => 'integer',
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

    /**
     * Label(jualan) yang menempel di produk, mis. "Paling laris". Diatur
     * admin lewat halaman Tag, bukan dari kode.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
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
     * Stok menipis, untuk chip filter di admin. Batasnya longgar supaya
     * admin diberi tahu sebelum benar-benar habis.
     */
    public function scopeStokMenipis(Builder $query, int $maks = 5): Builder
    {
        return $query->where('stok', '<=', $maks);
    }

    public function scopeCari(Builder $query, ?string $kata): Builder
    {
        $kata = trim((string) $kata);

        if ($kata === '') {
            return $query;
        }

        // Escape wildcard LIKE supaya "%" yang diketik pengguna tidak
        // membuat semua baris ikut terbawa.
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $kata);

        return $query->where('nama', 'like', "%{$escaped}%");
    }

    /**
     * Stok 0 = sudah habis, tombol tambah di katalog dimatikan.
     */
    public function getHabisAttribute(): bool
    {
        return $this->stok <= 0;
    }

    /**
     * Label stok untuk badge di katalog dan admin.
     */
    public function getLabelStokAttribute(): string
    {
        return match (true) {
            $this->stok <= 0 => 'Habis',
            $this->stok === 1 => 'Sisa 1',
            default => 'Sisa '.$this->stok,
        };
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
     * Foto yang tampil di katalog/admin: upload-an dulu, kalau kosong
     * pakai foto bawaan per kategori (sementara, tinggal taruh file-nya
     * di public/images). Kalau file-nya belum ada, null → tampil ikon.
     */
    /**
     * Foto yang tampil di katalog/admin: upload-an dulu, kalau kosong
     * pakai foto bawaan per kategori.
     *
     * Foto bawaan diambil versi WebP 360px: aslinya PNG 900-1131px sampai
     * 1,5 MB padahal di katalog cuma tampil ~300px.
     */
    public function getFotoFallbackAttribute(): ?string
    {
        if ($this->gambar) {
            return $this->url_gambar;
        }

        return $this->fotoBawaan(360);
    }

    /**
     * srcset supaya browser hanya unduh ukuran yang pas dengan layarnya
     * (180w buat HP kecil, 720b buat desktop). Nol kalau pakai foto upload.
     */
    public function getFotoSrcsetAttribute(): ?string
    {
        if ($this->gambar) {
            return null;
        }

        $bagian = [];

        foreach ([180, 360, 720] as $lebar) {
            if ($url = $this->fotoBawaan($lebar)) {
                $bagian[] = $url.' '.$lebar.'w';
            }
        }

        return $bagian === [] ? null : implode(', ', $bagian);
    }

    /**
     * Nama file foto bawaan untuk kategori produk ini, opsional disesuaikan
     * lebar pikselnya. Null kalau kategorinya bukan keduanya.
     */
    protected function fotoBawaan(?int $lebar): ?string
    {
        $nama = match ($this->kategori) {
            Kategori::PisangNugget => 'pisang-nugget',
            Kategori::EsMamboo => 'es-mambo',
            default => null,
        };

        return $nama ? GambarBawaan::url($nama, $lebar) : null;
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
