<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 40)->unique();
            $table->string('warna', 10)->default('kuning');
            // Tag sorot bikin kartu produknya dibedain di katalog, mis.
            // "Paling laris". Cuma berlaku kalau tag tampil di katalog.
            $table->boolean('tampil_katalog')->default(true);
            $table->boolean('sorot')->default(false);
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
