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
    use HasFactory;

    protected $fillable = ['siswa_id'];

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(KeranjangItem::class);
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
        $items = $this->items()
            ->with('produk')
            ->get();

        $baris = $items
            ->filter(fn (KeranjangItem $item) => $item->produk !== null && $item->produk->stok > 0)
            ->map(fn (KeranjangItem $item) => $item->keBaris())
            ->values();

        // Baris yang produknya hilang atau stoknya sudah 0 dibuang,
        // sekaligus dibersihkan dari database supaya tidak muncul lagi.
        $basi = $items->reject(
            fn (KeranjangItem $item) => $item->produk !== null && $item->produk->stok > 0
        );

        if ($basi->isNotEmpty()) {
            KeranjangItem::whereIn('id', $basi->pluck('id'))->delete();
        }

        return $baris->all();
    }

    public function total(): int
    {
        return collect($this->isi())->sum(fn (array $item) => $item['harga'] * $item['jumlah']);
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
        $this->items()->delete();

        $tersedia = Product::query()
            ->whereIn('id', array_column($baris, 'id'))
            ->pluck('stok', 'id');

        foreach ($baris as $barisItem) {
            $stok = $tersedia[$barisItem['id']] ?? null;

            // Produk yang tidak ada atau stoknya 0 tidak dimasukkan,
            // bukan disimpan dengan jumlah 0 yang mencemari keranjang.
            if (! $stok) {
                continue;
            }

            $jumlah = max(1, min((int) $barisItem['jumlah'], (int) $stok));

            $this->items()->create([
                'product_id' => $barisItem['id'],
                'jumlah' => $jumlah,
            ]);
        }
    }

    public function kosongkan(): void
    {
        $this->items()->delete();
    }
}
