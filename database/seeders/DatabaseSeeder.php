<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Urut penting: admin dulu, baru produk, lalu tag. Tag menunjuk
     * produk, jadi produk harus ada lebih dulu.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProdukSeeder::class,
            TagSeeder::class,
        ]);
    }
}
