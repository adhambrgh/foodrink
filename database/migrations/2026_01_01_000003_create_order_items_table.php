<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained()
                ->cascadeOnDelete();

            // restrictOnDelete: produk yang sudah pernah dipesan tidak boleh
            // dihapus, supaya historis pesanan tetap utuh.
            $table->foreignId('product_id')
                ->constrained()
                ->restrictOnDelete();

            // Salinan nama dan harga saat order dibuat. Harga produk boleh
            // naik belakangan, tapi pesanan lama harus tetap menunjukkan
            // harga yang benar-benar dibayar.
            $table->string('nama', 120);
            $table->unsignedInteger('harga');
            $table->unsignedInteger('jumlah');
            $table->unsignedInteger('subtotal');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
