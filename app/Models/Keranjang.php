<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Keranjang milik satu siswa, disimpan di database.
 *
 * Sebelumnya keranjang hidup di session, jadi hilang begitu cookie
 * hilang dan tidak ikut ke perangkat lain. Sekarang begitu siswa login,
 * keranjangnya mengikuti dia: ganti HP atau clears cache tidak
 * remove jajan yang sudah dipilih.
 *
 * Keranjang sengaja tidak menyimpan harga. Harga dan stok selalu diambil
 * ulang dari tabel products saat checkout, karena harga yang terkirim
 * dari browser tidak boleh dipercaya.
 */
class Keranjang extends Model
{
    /** @use HasFactory<KeranjangFactory> */
    use HasFactory; // trait factory untuk pembuatan data testing

    protected $fillable = ['siswa_id']; // kolom yang boleh diisi mass-assignment

    public function siswa(): BelongsTo // relasi balik ke pemilik keranjang
    {
        return $this->belongsTo(Siswa::class); // keranjang dimiliki oleh satu siswa
    }

    public function items(): HasMany // relasi daftar barang dalam keranjang
    {
        return $this->hasMany(KeranjangItem::class); // satu keranjang punya banyak baris item
    }

    /**
     * Bentuk keranjang seperti yang sudah dipakai controller dan view:
     * satu array per produk berisi id, nama, harga, jumlah, dan stok.
     *
     * Produk yang sudah dihapus atau stoknya berubah diambil paling
     * lambat: halaman keranjang ikut mencerminkan seperti katalog, bukan
     * menampilkan angka basi.
     *
     * @return list<array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}>
     */
    public function isi(): array
    {
        $items = $this->items() // ambil relasi items
            ->with('produk') // eager load data produk terkait
            ->get(); // eksekusi query ambil data

        $baris = $items
            ->filter(fn (KeranjangItem $item) => $item->produk !== null && $item->produk->stok > 0) // saring produk yang ada dan stoknya positif
            ->map(fn (KeranjangItem $item) => $item->keBaris()) // ubah tiap item jadi bentuk array baris
            ->values(); // reset indeks numerik array

        // Baris yang produknya hilang atau stoknya sudah 0 dibuang,
        // sekaligus dibersihkan dari database supaya tidak muncul lagi.
        $basi = $items->reject(
            fn (KeranjangItem $item) => $item->produk !== null && $item->produk->stok > 0
        ); // cari item yang produknya null atau stoknya habis

        if ($basi->isNotEmpty()) { // jika ada item yang basi
            KeranjangItem::whereIn('id', $basi->pluck('id'))->delete(); // hapus item basi dari database
        }

        return $baris->all(); // kembalikan array baris produk yang valid
    }

    public function total(): int
    {
        return collect($this->isi())->sum(fn (array $item) => $item['harga'] * $item['jumlah']); // hitung total harga seluruh item
    }

    /**
     * Ganti seluruh isi keranjang dengan daftar dari browser.
     *
     * Sengaja replace, bukan merge: keranjang di browser milik siswa
     * yang sedang login, jadi tidak ada keranjang lain yang perlu
     * diselamatkan di sini.
     *
     * @param  list<array{id: int, jumlah: int}>  $baris
     */
    public function isiDengan(array $baris): void
    {
        $this->items()->delete(); // kosongkan item lama sebelum isi ulang

        $tersedia = Product::query() // siapkan query pencarian produk
            ->whereIn('id', array_column($baris, 'id')) // ambil produk sesuai id yang dikirim
            ->pluck('stok', 'id'); // petik pasangan id produk dan stoknya

        foreach ($baris as $barisItem) { // iterasi setiap baris kiriman browser
            $stok = $tersedia[$barisItem['id']] ?? null; // cari stok produk yang tersedia di database

            // Produk yang tidak ada atau stoknya 0 tidak dimasukkan,
            // bukan disimpan dengan jumlah 0 yang mencemari keranjang.
            if (! $stok) { // jika stok kosong atau nol
                continue; // lewati produk yang tidak tersedia
            }

            $jumlah = max(1, min((int) $barisItem['jumlah'], (int) $stok)); // batasi jumlah minimal 1 dan maksimal stok

            $this->items()->create([ // simpan baris item baru ke keranjang
                'product_id' => $barisItem['id'], // tentukan id produk
                'jumlah' => $jumlah, // simpan jumlah item yang valid
            ]);
        }
    }

    public function kosongkan(): void
    {
        $this->items()->delete(); // hapus seluruh item di keranjang
    }
}
