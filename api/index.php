<?php

/**
 * Titik masuk serverless Vercel.
 *
 * Vercel hanya menjalankan berkas di bawah folder /api sebagai function,
 * jadi front controller Laravel yang aslinya di public/ dipanggil dari sini.
 * Seluruh request diarahkan ke file ini lewat `routes` di vercel.json.
 */

require __DIR__.'/../public/index.php';

/**
 * Serverless fix: Register core service providers manually at runtime.
 * Build-time package:discover tidak persist ke runtime di Vercel.
 */
$coreProviders = [
    Illuminate\Foundation\Providers\FoundationServiceProvider::class,
    Illuminate\Routing\RoutingServiceProvider::class,
    Illuminate\View\ViewServiceProvider::class,
    Illuminate\Translation\TranslationServiceProvider::class,
    Illuminate\Validation\ValidationServiceProvider::class,
    Illuminate\Auth\AuthServiceProvider::class,
    Illuminate\Session\SessionServiceProvider::class,
    Illuminate\Cookie\CookieServiceProvider::class,
    Illuminate\Encryption\EncryptionServiceProvider::class,
    Illuminate\Filesystem\FilesystemServiceProvider::class,
    Illuminate\Pipeline\PipelineServiceProvider::class,
];

foreach ($coreProviders as $provider) {
    $app->register($provider);
}

/**
 * Fallback: Force package discovery for any additional packages.
 */
try {
    $kernel = $app->make('Illuminate\Contracts\Console\Kernel');
    $kernel->call('package:discover', ['--ansi' => true]);
} catch (Throwable $e) {
    // Ignore if console kernel not available
}
