<?php

namespace App\Http\Controllers\Admin; // namespace admin

use App\Http\Controllers\Controller; // kontroler induk
use Illuminate\Http\RedirectResponse; // response redirect
use Illuminate\Http\Request; // request HTTP
use Illuminate\Support\Facades\Auth; // facade Auth
use Illuminate\View\View; // view response

/**
 * Autentikasi khusus petugas/admin pengelola toko.
 * Memakai guard `web` standar Laravel (tabel `users`).
 */
class AuthController extends Controller // kontroler auth admin
{
    /**
     * Halaman form login admin. Bila sesi sudah aktif, langsung dilempar ke dashboard.
     */
    public function login(): View|RedirectResponse // tampilkan form login
    {
        if (Auth::check()) { // cek sudah login
            return redirect()->route('admin.produk.index'); // lempar ke dashboard
        }

        return view('admin.login'); // render form login
    }

    /**
     * Verifikasi kredensial admin & buat sesi baru.
     * Session di-regenerate untuk mencegah serangan session fixation.
     */
    public function masuk(Request $request): RedirectResponse // proses login admin
    {
        $data = $request->validate([ // validasi input login
            'email' => ['required', 'string', 'max:255'], // email wajib
            'password' => ['required', 'string'], // password wajib
        ], [], [
            'email' => 'email / nama admin', // label email
            'password' => 'kata sandi', // label password
        ]);

        if (! Auth::attempt($data, $request->boolean('ingat'))) { // coba login
            return back() // kembali ke form
                ->withInput($request->only('email', 'ingat')) // simpan input
                ->with('galat', 'Email atau kata sandi salah.'); // pesan gagal
        }

        $request->session()->regenerate(); // regenerasi session ID

        return redirect()
            ->intended(route('admin.produk.index')) // ke tujuan/dashboard
            ->with('sukses', 'Selamat datang kembali, Admin.'); // pesan sukses
    }

    /**
     * Hancurkan sesi login admin dan refresh CSRF token.
     */
    public function keluar(Request $request): RedirectResponse // logout admin
    {
        Auth::logout(); // logout user
        $request->session()->invalidate(); // invalidasi session
        $request->session()->regenerateToken(); // regenerasi CSRF token

        return redirect()->route('admin.login')->with('sukses', 'Sudah keluar. Sampai jumpa.'); // redirect login
    }
}