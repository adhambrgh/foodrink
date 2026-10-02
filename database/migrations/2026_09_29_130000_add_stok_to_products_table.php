<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedSmallInteger('stok')->default(0)->after('harga');
        });

        // Produk lama belum pernah dihitung stoknya. Kasih angka yang
        // cukup supaya tetap bisa dijual, admin bisa diubah sendiri.
        DB::table('products')->update(['stok' => 50]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('stok');
        });
    }
};
