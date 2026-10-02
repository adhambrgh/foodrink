<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Autentikasi khusus petugas/admin pengelola toko.
 * Memakai guard `web` standar Laravel (tabel `users`).
 */
class AuthController extends Controller
{
    /**
     * Halaman form login admin. Bila sesi sudah aktif, langsung dilempar ke dashboard.
     */
    public function login(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('admin.produk.index');
        }

        return view('admin.login');
    }

    /**
     * Verifikasi kredensial admin & buat sesi baru.
     * Session di-regenerate untuk mencegah serangan session fixation.
     */
    public function masuk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ], [], [
            'email' => 'email / nama admin',
            'password' => 'kata sandi',
        ]);

        if (! Auth::attempt($data, $request->boolean('ingat'))) {
            return back()
                ->withInput($request->only('email', 'ingat'))
                ->with('galat', 'Email atau kata sandi salah.');
        }

        $request->session()->regenerate();

        return redirect()
            ->intended(route('admin.produk.index'))
            ->with('sukses', 'Selamat datang kembali, Admin.');
    }

    /**
     * Hancurkan sesi login admin dan refresh CSRF token.
     */
    public function keluar(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('sukses', 'Sudah keluar. Sampai jumpa.');
    }
}
