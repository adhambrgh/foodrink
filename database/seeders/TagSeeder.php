<?php

namespace Database\Seeders;

use App\Enums\WarnaTag;
use App\Models\Product;
use App\Models\Tag;
use Illuminate\Database\Seeder;

/**
 * Tag jualan yang tadinya dipatok dari nama produk di katalog. Sekarang
 * jadi data sendiri supaya admin bisa ubah, tambah, dan hapus.
 *
 * Idempoten: jalan berulang tidak menduplikasi tag atau attach.
 */
class TagSeeder extends Seeder
{
    private const TAG = [
        [
            'nama' => 'Paling laris',
            'warna' => WarnaTag::Bata,
            'sorot' => true,
            'urutan' => 1,
            'produk' => ['Pisang Nugget Coklat Keju'],
        ],
        [
            'nama' => 'Anak kelas suka',
            'warna' => WarnaTag::Kuning,
            'sorot' => false,
            'urutan' => 2,
            'produk' => ['Pisang Nugget Keju Susu'],
        ],
        [
            'nama' => 'Buat berdua',
            'warna' => WarnaTag::Hijau,
            'sorot' => false,
            'urutan' => 3,
            'produk' => ['Pisang Nugget Original Extra Porsi'],
        ],
        [
            'nama' => 'Musiman',
            'warna' => WarnaTag::Biru,
            'sorot' => false,
            'urutan' => 4,
            'produk' => ['Es Mamboo Mangga'],
        ],
    ];

    public function run(): void
    {
        foreach (self::TAG as $baris) {
            $tag = Tag::updateOrCreate(
                ['nama' => $baris['nama']],
                [
                    'warna' => $baris['warna'],
                    'sorot' => $baris['sorot'],
                    'urutan' => $baris['urutan'],
                    'tampil_katalog' => true,
                ]
            );

            $ids = Product::whereIn('nama', $baris['produk'])->pluck('id');

            if ($ids->isNotEmpty()) {
                $tag->products()->syncWithoutDetaching($ids);
            }
        }

        $jumlah = count(self::TAG);

        $this->command?->info("{$jumlah} tag jualan di-seed.");
    }
}
