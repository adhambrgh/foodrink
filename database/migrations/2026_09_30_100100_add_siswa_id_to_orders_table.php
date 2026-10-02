<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mengikat pesanan ke siswa yang membuatnya.
 *
 * Kolomnya nullable dan tidak diisi ulang dari data lama: order yang
 * dibuat sebelum fitur ini ada dibuat tanpa identitas, dan mengarang
 * siswa untuknya justru lebih berbahaya daripada membiarkannya kosong.
 * Order tanpa siswa_id tetap utuh untuk laporan pendapatan admin, tapi
 * tidak akan muncul di halaman pesanan siapa pun.
 *
 * nullOnDelete, bukan cascade: kalau siswa dihapus, riwayatnya hilang
 * dari sisi siswa, tapi catatan order untuk laporan pendapatan tidak
 * ikut terhapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('siswa_id')
                ->nullable()
                ->after('kode')
                // constrained() tanpa argumen akan menebak tabelnya
                // "siswas" dari nama kolom. Tabel kita tetap "siswa".
                ->constrained('siswa')
                ->nullOnDelete();

            // Halaman "pesanan saya" selalu memfilter lewat siswa_id lalu
            // diurutkan per status, jadi index gabungan ini yang dipakai.
            $table->index(['siswa_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['siswa_id']);
            $table->dropIndex(['siswa_id', 'created_at']);
            $table->dropColumn('siswa_id');
        });
    }
};
