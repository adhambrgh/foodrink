<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider // provider konfigurasi aplikasi
{
    /**
     * Register any application services.
     */
    public function register(): void // tempat layanan di-container didaftarkan
    {
        //
        // tidak ada binding tambahan di sini
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void // tempat logika yang jalan saat aplikasi boot
    {
        //
        // tidak ada booting tambahan di sini
    }
}
