<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Siswa disimpan di tabel terpisah dari `users`, bukan digabung.
 *
 * Alasannya bukan sekadar "`users` itu buat admin": dengan satu tabel,
 * setiap siswa yang daftar otomatis lolos middleware auth di /admin
 * karena keduanya memakai guard yang sama dan tidak ada kolom role. Dengan
 * tabel terpisah, `users` tetap berarti "admin", jadi pengaman yang
 * sudah ada di route /admin tidak perlu ditembus dari sisi lain.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('siswa', function (Blueprint $table) {
            $table->id();

            // Disimpan sebagai string, bukan integer: NIS bisa punya nol
            // di depan atau huruf awalan, dan memaksakan integer akan
            // membuangnya tanpa alasan.
            $table->string('nis', 32)->unique();

            $table->string('nama', 120);

            // Kelas disimpan terpisah supaya pemesanan berikutnya bisa
            // diisi tanpa mengetik ulang. Semua opsional: belum semua
            // siswa tahu kelasnya atau sudah masuk.
            $table->string('tingkat', 5)->nullable();
            $table->string('jurusan', 10)->nullable();
            $table->char('kode_kelas', 1)->nullable();
            $table->string('ruang', 60)->nullable();

            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // Satu keranjang per siswa, bukan per browser: begitu siswa login,
        // isi keranjangnya ikut ke akun dan ganti perangkat.
        Schema::create('keranjangs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->unique()->constrained('siswa')->cascadeOnDelete();
            $table->timestamps();
        });

        // Harga sengaja tidak disimpan di sini. Harga diambil ulang dari
        // tabel products saat checkout, sama seperti sebelumnya, supaya
        // harga yang tidak pernah bisa dikunci dari sisi browser.
        Schema::create('keranjang_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('keranjang_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->unsignedInteger('jumlah');

            $table->timestamps();

            // Satu produk hanya boleh punya satu baris per keranjang,
            // supaya tidak ada duplikat saat produk ditambah dua kali.
            $table->unique(['keranjang_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keranjang_items');
        Schema::dropIfExists('keranjangs');
        Schema::dropIfExists('siswa');
    }
};
