<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Field ini diisi pembeli sebagai nama ruangan tujuan antar, contoh
        // "X IPA 1" -- makanya kolomnya diubah dari "kelas" jadi "ruang"
        // supaya tidak menyesatkan, dan dilebihkan ke 60 karakter karena
        // nama ruangan bisa lebih panjang dari kode kelas.
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('kelas', 'ruang');
            $table->string('ruang', 60)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('ruang', 'kelas');
            $table->string('kelas', 30)->nullable()->change();
        });
    }
};
