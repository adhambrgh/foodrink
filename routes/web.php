<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\PendapatanController;
use App\Http\Controllers\Admin\PesananController as AdminPesananController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\TagController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\KatalogController;
use App\Http\Controllers\KeranjangController;
use App\Http\Controllers\PesananController;
use App\Http\Controllers\Siswa\AuthController as SiswaAuthController;
use App\Http\Controllers\Siswa\ProfilController;
use Illuminate\Support\Facades\Route;

// Login siswa. Pakai guard `siswa` yang terpisah dari `web` milik admin.
Route::prefix('siswa')->name('siswa.')->group(function () {
    Route::get('/masuk', [SiswaAuthController::class, 'masuk'])->name('masuk');
    Route::post('/masuk', [SiswaAuthController::class, 'prosesMasuk'])->name('masuk.aksi');
    Route::get('/daftar', [SiswaAuthController::class, 'daftar'])->name('daftar');
    Route::post('/daftar', [SiswaAuthController::class, 'prosesDaftar'])->name('daftar.aksi');
    Route::post('/keluar', [SiswaAuthController::class, 'keluar'])->name('keluar');
});

// Profil siswa butuh akun: isinya memuat NIS dan tujuan antar.
Route::middleware('auth:siswa')->prefix('siswa')->name('siswa.')->group(function () {
    Route::get('/profil', [ProfilController::class, 'index'])->name('profil');
    Route::put('/profil', [ProfilController::class, 'update'])->name('profil.update');
});

// Katalog sengaja terbuka: orang boleh lihat menu dan harganya sebelum
// decides untuk bikin akun.
Route::get('/', [KatalogController::class, 'index'])->name('katalog');

Route::get('/keranjang', [KeranjangController::class, 'index'])->name('keranjang');

Route::middleware('auth:siswa')->group(function () {
    Route::post('/keranjang/sinkron', [KeranjangController::class, 'sinkron'])
        ->middleware('throttle:120,1')
        ->name('keranjang.sinkron');

    Route::prefix('checkout')->name('checkout.')->group(function () {
        Route::post('/prepare', [CheckoutController::class, 'prepare'])->name('prepare');
        Route::get('/', [CheckoutController::class, 'index'])->name('index');
        Route::get('/finish', [CheckoutController::class, 'finish'])->name('finish');
        Route::get('/unfinish', [CheckoutController::class, 'unfinish'])->name('unfinish');
        Route::get('/error', [CheckoutController::class, 'error'])->name('error');
    });

    // Riwayat & struk pesanan pembeli. Yang boleh membuka hanya order
    // dengan siswa_id milik dia, jadi mengetik kode orang lain tidak
    // membuka apa-apa.
    Route::get('/pesanan', [PesananController::class, 'index'])->name('pesanan.index');
    Route::get('/pesanan/{kode}', [PesananController::class, 'show'])->name('pesanan.show');
});

// Callback Midtrans TIDAK memakai auth:siswa: yang memanggil adalah
// server Midtrans, bukan browser siswa, jadi tidak ada session. Keamanannya
// datang dari verifikasi signature_key dengan server key di dalam controller.
Route::post('/checkout/callback', [CheckoutController::class, 'callback'])
    ->name('checkout.callback');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'masuk'])->name('masuk');
    Route::post('/logout', [AuthController::class, 'keluar'])->name('keluar');

    // `auth` tanpa argumen berarti guard `web` = users = admin. Siswa tidak
    // bisa sampai ke sini karena mereka login di guard `siswa`.
    Route::middleware('auth')->group(function () {
        Route::get('/', fn () => redirect()->route('admin.produk.index'));
        Route::resource('produk', ProductController::class)->except(['show']);
        Route::post('produk/{produk}/toggle', [ProductController::class, 'toggle'])->name('produk.toggle');
        Route::patch('produk/{produk}/stok', [ProductController::class, 'updateStok'])->name('produk.stok');
        Route::get('pendapatan', [PendapatanController::class, 'index'])->name('pendapatan');
        Route::get('pesanan', [AdminPesananController::class, 'index'])->name('pesanan.index');
        Route::patch('pesanan/{pesanan}/status', [AdminPesananController::class, 'status'])->name('pesanan.status');
        // Tidak ada halaman create/edit terpisah: tag dibuat dan diubah
        // langsung di daftar, jadi hanya aksi yang benar-benar ada.
        Route::resource('tag', TagController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::put('tag/{tag}/produk', [TagController::class, 'produk'])->name('tag.produk');
    });
});
