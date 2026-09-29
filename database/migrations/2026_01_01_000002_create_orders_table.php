<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 12)->unique();
            $table->string('nama', 120);
            $table->string('kelas', 30)->nullable();
            $table->string('no_wa', 25);
            $table->string('cara_ambil', 10);
            $table->string('metode_bayar', 10);
            $table->string('status', 20);
            $table->unsignedInteger('total');
            $table->string('midtrans_order_id', 100)->nullable();
            $table->text('snap_token')->nullable();
            $table->timestamp('batas_bayar')->nullable();
            $table->timestamps();

            // Dashboard: filter pesanan per status dan urut berdasarkan tanggal.
            $table->index(['status', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
