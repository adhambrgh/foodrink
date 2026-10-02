<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Nama produknya "Es Mamboo", jadi nilai kategorinya ikut dikoreksi
     * dari `es_maboo` (huruf b kelewat) jadi `es_mamboo`. Tanpa ini,
     * baris lama gagal di-cast ke enum Kategori dan halaman katalog
     * langsung 500.
     */
    public function up(): void
    {
        DB::table('products')
            ->where('kategori', 'es_maboo')
            ->update(['kategori' => 'es_mamboo']);
    }

    public function down(): void
    {
        DB::table('products')
            ->where('kategori', 'es_mamboo')
            ->update(['kategori' => 'es_maboo']);
    }
};
