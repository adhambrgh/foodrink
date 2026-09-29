<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Admin dulu, baru produk: admin yang mau manages katalog harus
     * bisa masuk sebelum ada isi.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProdukSeeder::class,
        ]);
    }
}
