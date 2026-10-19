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
    use HasFactory; // trait factory untuk pembuatan data testing

    protected $fillable = [ // kolom yang boleh diisi mass-assignment
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

    protected function casts(): array // tentukan konversi tipe data kolom
    {
        return [
            'harga' => 'integer', // ubah harga jadi angka bulat
            'stok' => 'integer', // ubah stok jadi angka bulat
            'tersedia' => 'boolean', // ubah tersedia jadi boolean
            'urutan' => 'integer', // ubah urutan jadi angka bulat
            'kategori' => Kategori::class, // ubah kategori jadi enum Kategori
        ];
    }

    protected static function booted(): void // hook saat model di-boot
    {
        static::saving(function (Product $produk) { // jalankan sebelum data disimpan
            if (blank($produk->slug)) { // jika slug masih kosong
                $produk->slug = static::slugDari($produk->nama, $produk->exists ? $produk->getKey() : null); // buat slug unik dari nama
            }
        });
    }

    public function orderItems(): HasMany // relasi item pesanan produk ini
    {
        return $this->hasMany(OrderItem::class); // satu produk muncul di banyak item
    }

    /**
     * Label(jualan) yang menempel di produk, mis. "Paling laris". Diatur
     * admin lewat halaman Tag, bukan dari kode.
     */
    public function tags(): BelongsToMany // relasi label produk
    {
        return $this->belongsToMany(Tag::class)->withTimestamps(); // relasi many-to-many dengan timestamp pivot
    }

    public function scopeTersedia(Builder $query): Builder // scope produk yang tersedia
    {
        return $query->where('tersedia', true); // hanya produk bertanda tersedia
    }

    /**
     * Urutan tampil: kolom urutan dulu, nama sebagai pemutus agar katalog
     * tidak berganti-ganti posisi kalau dua produk punya urutan sama.
     */
    public function scopeUrut(Builder $query): Builder // scope urutan tampil produk
    {
        return $query->orderBy('urutan')->orderBy('nama'); // urutkan berdasarkan urutan lalu nama
    }

    public function scopeKategori(Builder $query, Kategori $kategori): Builder // scope filter per kategori
    {
        return $query->where('kategori', $kategori->value); // cocokkan kolom kategori
    }

    /**
     * Stok menipis, untuk chip filter di admin. Batasnya longgar supaya
     * admin diberi tahu sebelum benar-benar habis.
     */
    public function scopeStokMenipis(Builder $query, int $maks = 5): Builder // scope stok menipis
    {
        return $query->where('stok', '<=', $maks); // produk dengan stok di bawah batas
    }

    public function scopeCari(Builder $query, ?string $kata): Builder // scope pencarian produk
    {
        $kata = trim((string) $kata); // bersihkan spasi kata kunci

        if ($kata === '') { // jika kata kunci kosong
            return $query; // kembalikan query tanpa filter
        }

        // Escape wildcard LIKE supaya "%" yang diketik pengguna tidak
        // membuat semua baris ikut terbawa.
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $kata); // escape karakter khusus LIKE

        return $query->where('nama', 'like', "%{$escaped}%"); // cari nama mengandung kata kunci
    }

    /**
     * Stok 0 = sudah habis, tombol tambah di katalog dimatikan.
     */
    public function getHabisAttribute(): bool // accessor status habis
    {
        return $this->stok <= 0; // habis jika stok nol atau kurang
    }

    /**
     * Label stok untuk badge di katalog dan admin.
     */
    public function getLabelStokAttribute(): string // accessor label stok
    {
        return match (true) { // pilih label sesuai kondisi
            $this->stok <= 0 => 'Habis', // label jika stok habis
            $this->stok === 1 => 'Sisa 1', // label jika stok tersisa satu
            default => 'Sisa '.$this->stok, // label sisa stok lainnya
        };
    }

    /**
     * Harga dalam format Rupiah untuk ditampilkan.
     */
    public function getHargaRupiahAttribute(): string // accessor harga format rupiah
    {
        return 'Rp '.number_format($this->harga, 0, ',', '.'); // format harga jadi rupiah
    }

    public function getUrlGambarAttribute(): ?string // accessor URL gambar upload
    {
        return $this->gambar // jika ada file gambar
            ? asset('storage/'.$this->gambar) // kembalikan URL dari storage
            : null; // kosongkan jika tidak ada
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
    public function getFotoFallbackAttribute(): ?string // foto upload atau foto bawaan
    {
        if ($this->gambar) { // jika ada foto upload
            return $this->url_gambar; // pakai URL upload
        }

        return $this->fotoBawaan(360); // fallback ke foto bawaan lebar 360px
    }

    /**
     * srcset supaya browser hanya unduh ukuran yang pas dengan layarnya
     * (180w buat HP kecil, 720b buat desktop). Nol kalau pakai foto upload.
     */
    public function getFotoSrcsetAttribute(): ?string // susun atribut srcset gambar
    {
        if ($this->gambar) { // foto upload tidak perlu srcset
            return null; // kembalikan null
        }

        $bagian = []; // siapkan daftar kandidat srcset

        foreach ([180, 360, 720] as $lebar) { // iterasi tiap lebar
            if ($url = $this->fotoBawaan($lebar)) { // ambil URL foto bawaan bila ada
                $bagian[] = $url.' '.$lebar.'w'; // susun format srcset
            }
        }

        return $bagian === [] ? null : implode(', ', $bagian); // gabung atau null
    }

    /**
     * Nama file foto bawaan untuk kategori produk ini, opsional disesuaikan
     * lebar pikselnya. Null kalau kategorinya bukan keduanya.
     */
    protected function fotoBawaan(?int $lebar): ?string // bangun URL foto bawaan
    {
        $nama = match ($this->kategori) { // petakan kategori ke nama file
            Kategori::PisangNugget => 'pisang-nugget', // nama file kategori nugget
            Kategori::EsMamboo => 'es-mambo', // nama file kategori es mambo
            default => null, // kategori lain tanpa foto bawaan
        };

        return $nama ? GambarBawaan::url($nama, $lebar) : null; // ambil URL file atau null
    }

    /**
     * Slug unik dari nama produk. Nama duplikat mendapat akhiran angka
     * (mis. "pisang-nugget-original-2") supaya tidak bentrok di index unique.
     *
     * $abaikanId dipakai supaya produk yang sedang di-update tidak dianggap
     * bentrok dengan slug lamanya sendiri.
     */
    public static function slugDari(string $nama, ?int $abaikanId = null): string // buat slug unik dari nama
    {
        $dasar = Str::slug($nama); // ubah nama jadi slug

        if ($dasar === '') { // jika slug kosong
            $dasar = 'produk'; // pakai nama dasar default
        }

        $slug = $dasar; // inisialisasi slug sementara
        $urutan = 2; // inisialisasi nomor akhiran

        $bentrok = static::query() // cek keberadaan slug
            ->where('slug', $slug) // cocokkan slug
            ->when($abaikanId !== null, fn (Builder $q) => $q->where('id', '!=', $abaikanId)) // abaikan id produk sendiri
            ->exists(); // hasil true bila sudah terpakai

        while ($bentrok) { // selama slug masih bentrok
            $slug = $dasar.'-'.$urutan; // tambahkan nomor akhiran
            $urutan++; // naikkan nomor akhiran

            $bentrok = static::query() // cek ulang slug bentrok
                ->where('slug', $slug) // cocokkan slug baru
                ->when($abaikanId !== null, fn (Builder $q) => $q->where('id', '!=', $abaikanId)) // abaikan id produk sendiri
                ->exists(); // hasil true bila bentrok lagi
        }

        return $slug; // kembalikan slug yang sudah unik
    }
}
