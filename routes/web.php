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
Route::prefix('siswa')->name('siswa.')->group(function () { // Group route siswa dengan prefix /siswa
    Route::get('/masuk', [SiswaAuthController::class, 'masuk'])->name('masuk'); // Halaman login siswa
    Route::post('/masuk', [SiswaAuthController::class, 'prosesMasuk'])->name('masuk.aksi'); // Proses login siswa
    Route::get('/daftar', [SiswaAuthController::class, 'daftar'])->name('daftar'); // Halaman daftar siswa
    Route::post('/daftar', [SiswaAuthController::class, 'prosesDaftar'])->name('daftar.aksi'); // Proses daftar siswa
    Route::post('/keluar', [SiswaAuthController::class, 'keluar'])->name('keluar'); // Logout siswa
});

// Profil siswa butuh akun: isinya memuat NIS dan tujuan antar.
Route::middleware('auth:siswa')->prefix('siswa')->name('siswa.')->group(function () { // Route profil butuh login siswa
    Route::get('/profil', [ProfilController::class, 'index'])->name('profil'); // Tampilkan profil siswa
    Route::put('/profil', [ProfilController::class, 'update'])->name('profil.update'); // Update profil siswa
});

// Katalog sengaja terbuka: orang boleh lihat menu dan harganya sebelum
// decides untuk bikin akun.
Route::get('/', [KatalogController::class, 'index'])->name('katalog'); // Halaman katalog produk

Route::get('/keranjang', [KeranjangController::class, 'index'])->name('keranjang'); // Halaman keranjang belanja

Route::middleware('auth:siswa')->group(function () { // Route butuh login siswa
    Route::post('/keranjang/sinkron', [KeranjangController::class, 'sinkron']) // Sinkron keranjang dari localStorage
        ->middleware('throttle:120,1')
        ->name('keranjang.sinkron');

    Route::prefix('checkout')->name('checkout.')->group(function () { // Group route checkout
        Route::post('/prepare', [CheckoutController::class, 'prepare'])->name('prepare'); // Siapkan pembayaran Midtrans
        Route::get('/', [CheckoutController::class, 'index'])->name('index'); // Halaman checkout
        Route::get('/finish', [CheckoutController::class, 'finish'])->name('finish'); // Selesai bayar sukses
        Route::get('/unfinish', [CheckoutController::class, 'unfinish'])->name('unfinish'); // Belum bayar / pending
        Route::get('/error', [CheckoutController::class, 'error'])->name('error'); // Error pembayaran
    });

    // Riwayat & struk pesanan pembeli. Yang boleh membuka hanya order
    // dengan siswa_id milik dia, jadi mengetik kode orang lain tidak
    // membuka apa-apa.
    Route::get('/pesanan', [PesananController::class, 'index'])->name('pesanan.index'); // Daftar pesanan siswa
    Route::get('/pesanan/{kode}', [PesananController::class, 'show'])->name('pesanan.show'); // Detail pesanan by kode
});

// Callback Midtrans TIDAK memakai auth:siswa: yang memanggil adalah
// server Midtrans, bukan browser siswa, jadi tidak ada session. Keamanannya
// datang dari verifikasi signature_key dengan server key di dalam controller.
Route::post('/checkout/callback', [CheckoutController::class, 'callback']) // Webhook callback Midtrans
    ->name('checkout.callback');

Route::prefix('admin')->name('admin.')->group(function () { // Group route admin dengan prefix /admin
    Route::get('/login', [AuthController::class, 'login'])->name('login'); // Halaman login admin
    Route::post('/login', [AuthController::class, 'masuk'])->name('masuk'); // Proses login admin
    Route::post('/logout', [AuthController::class, 'keluar'])->name('keluar'); // Logout admin

    // `auth` tanpa argumen berarti guard `web` = users = admin. Siswa tidak
    // bisa sampai ke sini karena mereka login di guard `siswa`.
    Route::middleware('auth')->group(function () { // Route butuh login admin (guard web)
        Route::get('/', fn () => redirect()->route('admin.produk.index')); // Redirect ke daftar produk
        Route::resource('produk', ProductController::class)->except(['show']); // CRUD produk admin
        Route::post('produk/{produk}/toggle', [ProductController::class, 'toggle'])->name('produk.toggle'); // Toggle aktif/nonaktif produk
        Route::patch('produk/{produk}/stok', [ProductController::class, 'updateStok'])->name('produk.stok'); // Update stok produk
        Route::get('pendapatan', [PendapatanController::class, 'index'])->name('pendapatan'); // Laporan pendapatan
        Route::get('pesanan', [AdminPesananController::class, 'index'])->name('pesanan.index'); // Daftar pesanan admin
        Route::patch('pesanan/{pesanan}/status', [AdminPesananController::class, 'status'])->name('pesanan.status'); // Update status pesanan
        // Tidak ada halaman create/edit terpisah: tag dibuat dan diubah
        // langsung di daftar, jadi hanya aksi yang benar-benar ada.
        Route::resource('tag', TagController::class)->only(['index', 'store', 'update', 'destroy']); // CRUD tag (tanpa show)
        Route::put('tag/{tag}/produk', [TagController::class, 'produk'])->name('tag.produk'); // Assign produk ke tag
    });
});
