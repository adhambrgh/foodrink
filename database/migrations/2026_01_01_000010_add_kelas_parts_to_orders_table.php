<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ruangan tujuan antar dipecah jadi bagian yang bisa dipilih:
        // tingkat (X/XI/XII), jurusan, dan kode kelas A-H. Ditambah kolom
        // `ruang` bebas untuk nama ruangan fisik ("Ruang 204", "Lapangan"),
        // karena tidak semua kelas punya nama ruangan yang baku.
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tingkat', 5)->nullable()->after('nama');
            $table->string('jurusan', 10)->nullable()->after('tingkat');
            $table->char('kode_kelas', 1)->nullable()->after('jurusan');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tingkat', 'jurusan', 'kode_kelas']);
        });
    }
};
