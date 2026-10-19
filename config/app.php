<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

    'name' => env('APP_NAME', 'Laravel'), // Nama aplikasi ditampilkan di UI

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'), // Lingkungan aplikasi (local/production)

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false), // Mode debug untuk tampilkan error detail

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => env('APP_URL', 'http://localhost'), // Base URL aplikasi untuk generate link

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Dibaca dari APP_TIMEZONE supaya bisa diganti per environment tanpa
    | menyentuh kode. Wajib Asia/Jakarta: filter "pesanan hari ini" di
    | dashboard memakai now()->startOfDay(), dan kalau timezone-nya UTC
    | angkanya meleset setelah lewat tengah malam WIB.
    |
    */

    'timezone' => env('APP_TIMEZONE', 'UTC'), // Zona waktu default aplikasi

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'), // Bahasa utama aplikasi

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'), // Bahasa cadangan jika translation hilang

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'), // Bahasa data palsu untuk faker

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC', // Algoritma enkripsi data

    'key' => env('APP_KEY'), // Kunci rahasia enkripsi Laravel

    'previous_keys' => [ // Kunci enkripsi lama saat rotasi
        ...array_filter(
            explode(',', env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'), // Driver status mode perbaikan
        'store' => env('APP_MAINTENANCE_STORE', 'database'), // Tempat simpan cache mode perbaikan
    ],

];
