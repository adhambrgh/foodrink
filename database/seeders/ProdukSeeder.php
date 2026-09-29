<?php

namespace Database\Seeders;

use App\Enums\Kategori;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProdukSeeder extends Seeder
{
    /**
     * Enam produk contoh supaya katalog langsung terlihat utuh setelah
     * install, bukan halaman kosong yang bikin ragu.
     *
     * Kunci updateOrCreate adalah `nama` -- satu-satunya field yang selalu
     * diisi dan sudah unik secara makna. `slug` sengaja tidak dipakai
     * sebagai kunci karena ia auto-generate.
     *
     * Gambar sengaja null: produk asli perlu foto, dan placeholder krem
     * di katalog terlihat lebih baik daripada gambar sample yang menyesatkan.
     */
    private const PRODUK = [
        [
            'nama' => 'Pisang Nugget Original',
            'kategori' => Kategori::PisangNugget,
            'harga' => 10000,
            'deskripsi' => 'Pisang beku berlapis adonan, digoreng sampai kecokelatan. Satu potong, sambal kecap atau susu kental manis.',
            'urutan' => 1,
        ],
        [
            'nama' => 'Pisang Nugget Coklat Keju',
            'kategori' => Kategori::PisangNugget,
            'harga' => 12000,
            'deskripsi' => 'Isi coklat dan keju leleh yang melimpah di setiap gigitan.',
            'urutan' => 2,
        ],
        [
            'nama' => 'Pisang Nugget Keju Susu',
            'kategori' => Kategori::PisangNugget,
            'harga' => 12000,
            'deskripsi' => 'Keju dan susu kental manis, milder daripada versi coklat.',
            'urutan' => 3,
        ],
        [
            'nama' => 'Pisang Nugget Original Extra Porsi',
            'kategori' => Kategori::PisangNugget,
            'harga' => 15000,
            'deskripsi' => 'Tiga potong original dengan samba yang sama. Untuk yang lapar atau mau bawa pulang.',
            'urutan' => 4,
        ],
        [
            'nama' => 'Es Maboo Original',
            'kategori' => Kategori::EsMaboo,
            'harga' => 8000,
            'deskripsi' => 'Es serut CAMPUR Rolex, gula aren, dan susu. Ukuran cup sedang.',
            'urutan' => 1,
        ],
        [
            'nama' => 'Es Maboo Mangga',
            'kategori' => Kategori::EsMaboo,
            'harga' => 10000,
            'deskripsi' => 'Es serut CAMPUR Rolex dengan potongan mangga harum. Lebih manis sedikit.',
            'urutan' => 2,
        ],
    ];

    public function run(): void
    {
        foreach (self::PRODUK as $produk) {
            Product::updateOrCreate(
                ['nama' => $produk['nama']],
                [
                    'kategori' => $produk['kategori'],
                    'harga' => $produk['harga'],
                    'deskripsi' => $produk['deskripsi'],
                    'urutan' => $produk['urutan'],
                    'tersedia' => true,
                ]
            );
        }

        $jumlah = count(self::PRODUK);

        $this->command?->info("{$jumlah} produk contoh di-seed.");
    }
}
