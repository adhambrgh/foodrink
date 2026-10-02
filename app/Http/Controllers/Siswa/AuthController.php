<?php

namespace App\Http\Controllers\Siswa;

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\TingkatKelas;
use App\Models\Siswa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Login dan daftar untuk siswa.
 *
 * Terpisah dari App\Http\Controllers\Admin\AuthController karena memakai
 * guard dan tabel yang berbeda: `siswa` di sini, `web` untuk admin.
 * Session keduanya terpisah, jadi admin yang login di satu sisi tidak
 * otomatis masuk ke sisi lain.
 */
class AuthController
{
    private const GUARD = 'siswa';

    public function masuk(Request $request)
    {
        if (Auth::guard(self::GUARD)->check()) {
            return redirect()->route('keranjang');
        }

        return view('siswa.masuk');
    }

    public function prosesMasuk(Request $request): RedirectResponse
    {
        $kredensial = $request->validate(
            [
                'nis' => ['required', 'string', 'max:32'],
                'password' => ['required', 'string'],
            ],
            [
                'nis.required' => 'NIS belum diisi.',
                'nis.string' => 'NIS harusnya berupa angka.',
                'password.required' => 'Kata sandi belum diisi.',
            ]
        );

        // "ingat saya" sengaja tidak dipakai: mengetik ulang NIS di
        //space HP jauh lebih sering daripada mengetik ulang password,
        // jadi tidak ada gunanya mengingat sia-sia.
        if (! Auth::guard(self::GUARD)->attempt($kredensial)) {
            return back()
                ->withInput($request->only('nis'))
                ->withErrors([
                    'nis' => 'NIS atau kata sandi salah.',
                ]);
        }

        $request->session()->regenerate();

        return redirect()->intended(route('keranjang'));
    }

    public function daftar(Request $request)
    {
        if (Auth::guard(self::GUARD)->check()) {
            return redirect()->route('keranjang');
        }

        return view('siswa.daftar', [
            'tingkat' => TingkatKelas::cases(),
            'jurusan' => Jurusan::cases(),
            'kodeKelas' => KodeKelas::cases(),
        ]);
    }

    public function prosesDaftar(Request $request): RedirectResponse
    {
        // Kelas & ruang wajib diisi saat daftar. Data ini jadi alamat
        // antar saat checkout, jadi tidak boleh ada yang bolong.
        $data = $request->validate(
            [
                'nis' => ['required', 'string', 'max:32', 'unique:siswa,nis'],
                'nama' => ['required', 'string', 'max:120'],
                'password' => ['required', 'confirmed', Password::min(6)],
                'tingkat' => ['required', Rule::enum(TingkatKelas::class)],
                'jurusan' => ['required', Rule::enum(Jurusan::class)],
                'kode_kelas' => ['required', Rule::enum(KodeKelas::class)],
                'ruang' => ['required', 'string', 'max:60'],
            ],
            [
                'nis.unique' => 'NIS ini sudah terdaftar. Coba masuk saja.',
                'nama.required' => 'Nama belum diisi.',
                'password.confirmed' => 'Konfirmasi kata sandi tidak sama.',
                'tingkat.required' => 'Pilih tingkat kelas.',
                'jurusan.required' => 'Pilih jurusan.',
                'kode_kelas.required' => 'Pilih kode kelas.',
                'ruang.required' => 'Nama ruangan belum diisi.',
                'ruang.max' => 'Nama ruangan terlalu panjang.',
            ]
        );

        $siswa = Siswa::create([
            'nis' => trim($data['nis']),
            'nama' => trim($data['nama']),
            'tingkat' => $data['tingkat'] ?? null,
            'jurusan' => $data['jurusan'] ?? null,
            'kode_kelas' => $data['kode_kelas'] ?? null,
            'ruang' => $data['ruang'] ?? null,
            'password' => $data['password'],
        ]);

        Auth::guard(self::GUARD)->login($siswa);
        $request->session()->regenerate();

        return redirect()->route('keranjang')
            ->with('sukses', 'Akun dibuat. Selamat jajan, '.$siswa->nama.'!');
    }

    public function keluar(Request $request): RedirectResponse
    {
        Auth::guard(self::GUARD)->logout();

        // Keranjang sengaja tidak dihapus: mengosongkan keranjang saat
        // logout akan terasa seperti jajan hilang, padahal isinya masih
        // aman di akun dan muncul lagi begitu siswa login kembali.
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('katalog');
    }
}
