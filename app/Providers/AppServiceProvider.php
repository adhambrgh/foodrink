<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
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
        // Di balik proxy Vercel, TLS diputus di edge. Paksa skema https
        // supaya asset() dan route() tidak menghasilkan tautan http.
        if ($this->app->environment('production')) { // hanya produksi
            URL::forceScheme('https'); // paksa URL https
        }
    }
}
