<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Formulir checkout saat ini tidak meminta nomor WhatsApp, jadi kolom
        // nya dibiarkan kosong dulu supaya pencatatan order tidak tertahan.
        Schema::table('orders', function (Blueprint $table) {
            $table->string('no_wa', 25)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('no_wa', 25)->nullable(false)->change();
        });
    }
};
