<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Admin sekarang hanya punya dua status: sedang diproses dan selesai.
 * Status lama `dibuat` dan `kedaluwarsa` dihapus dari enum, jadi nilainya
 * harus dibersihkan dari database supaya tidak ada baris yang gagal
 * di-cast jadi enum.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')->where('status', 'dibuat')->update(['status' => 'lunas']);

        // Pesanan kedaluwarsa itu belum pernah dibayar, jadi tidak ada
        // jejak yang perlu disimpan. order_items cascadeOnDelete.
        DB::table('orders')->where('status', 'kedaluwarsa')->delete();
    }

    public function down(): void
    {
        // Tidak bisa dibalik: baris kedaluwarsa sudah dihapus, dan `dibuat`
        // tidak bisa ditebak mana yang sebelumnya sudah diantar atau belum.
        DB::table('orders')->where('status', 'lunas')->update(['status' => 'dibuat']);
    }
};
