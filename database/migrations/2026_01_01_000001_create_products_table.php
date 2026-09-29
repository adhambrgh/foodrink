<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 120);
            $table->string('slug', 140)->unique();
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('harga');
            $table->string('kategori', 20);
            $table->string('gambar')->nullable();
            $table->boolean('tersedia')->default(true);
            $table->integer('urutan')->default(0);
            $table->timestamps();

            $table->index(['kategori', 'tersedia']);
            $table->index(['kategori', 'urutan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
