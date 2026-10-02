<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->validateCsrfTokens(except: [
            'checkout/prepare',
        ]);

        // Pengunjung yang belum login diarahkan ke halaman login yang
        // sesuai dengan sisi yang sedang dibuka: admin ke /admin/login,
        // siswa ke /siswa/masuk. Tanpa pembagian ini, siswa yang menekan
        // "Bayar & pesan" akan diberi form login admin.
        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('admin', 'admin/*')
                ? route('admin.login')
                : route('siswa.masuk')
        );

        // Admin yang sudah login tidak punya alasan untuk melihat form
        // login lagi.
        $middleware->redirectUsersTo(
            fn (Request $request) => $request->is('admin', 'admin/*')
                ? route('admin.produk.index')
                : route('keranjang')
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
