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
        // Vercel menaruh proxy di depan app. Tanpa mempercayai header
        // X-Forwarded-*, Laravel mengira request datang via http dan
        // menghasilkan URL asset/route yang salah.
        $middleware->trustProxies(at: '*');

        // Webhook Midtrans datang dari server mereka tanpa cookie/session,
        // jadi tidak mungkin membawa token CSRF. Tanpa pengecualian ini,
        // callback selalu ditolak 419 dan order tidak pernah jadi lunas.
        $middleware->validateCsrfTokens(except: [
            'checkout/prepare',
            'checkout/callback',
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
