<?php

namespace App\Http\Controllers\Siswa; // namespace kontroler siswa

use App\Enums\Jurusan; // enum jurusan kelas
use App\Enums\KodeKelas; // enum kode kelas
use App\Enums\TingkatKelas; // enum tingkat kelas
use App\Models\Siswa; // model siswa
use Illuminate\Http\RedirectResponse; // response redirect
use Illuminate\Http\Request; // request HTTP
use Illuminate\Support\Facades\Auth; // facade Auth
use Illuminate\Validation\Rule; // aturan validasi
use Illuminate\Validation\Rules\Password; // aturan password

/**
 * Login dan daftar untuk siswa.
 *
 * Terpisah dari App\Http\Controllers\Admin\AuthController karena memakai
 * guard dan tabel yang berbeda: `siswa` di sini, `web` untuk admin.
 * Session keduanya terpisah, jadi admin yang login di satu sisi tidak
 * otomatis masuk ke sisi lain.
 */
class AuthController // kontroler auth siswa
{
    private const GUARD = 'siswa'; // nama guard siswa

    public function masuk(Request $request) // form login siswa
    {
        if (Auth::guard(self::GUARD)->check()) // cek sudah login
        {
            return redirect()->route('keranjang'); // lempar ke keranjang
        }

        return view('siswa.masuk'); // render form login
    }

    public function prosesMasuk(Request $request): RedirectResponse // proses login siswa
    {
        $kredensial = $request->validate( // validasi input login
            [
                'nis' => ['required', 'string', 'max:32'], // NIS wajib diisi
                'password' => ['required', 'string'], // password wajib diisi
            ],
            [
                'nis.required' => 'NIS belum diisi.', // pesan NIS kosong
                'nis.string' => 'NIS harusnya berupa angka.', // pesan NIS salah
                'password.required' => 'Kata sandi belum diisi.', // pesan password kosong
            ]
        );

        // "ingat saya" sengaja tidak dipakai: mengetik ulang NIS di
        //space HP jauh lebih sering daripada mengetik ulang password,
        // jadi tidak ada gunanya mengingat sia-sia.
        if (! Auth::guard(self::GUARD)->attempt($kredensial)) // coba login dengan kredensial
        {
            return back() // kembali ke halaman login
                ->withInput($request->only('nis')) // simpan NIS di input
                ->withErrors([
                    'nis' => 'NIS atau kata sandi salah.', // pesan login gagal
                ]);
        }

        $request->session()->regenerate(); // regenerasi session ID

        return redirect()->intended(route('keranjang')); // redirect ke tujuan
    }

    public function daftar(Request $request) // form daftar akun
    {
        if (Auth::guard(self::GUARD)->check()) // cek sudah login
        {
            return redirect()->route('keranjang'); // lempar ke keranjang
        }

        return view('siswa.daftar', [ // render form daftar
            'tingkat' => TingkatKelas::cases(), // opsi tingkat kelas
            'jurusan' => Jurusan::cases(), // opsi jurusan
            'kodeKelas' => KodeKelas::cases(), // opsi kode kelas
        ]);
    }

    public function prosesDaftar(Request $request): RedirectResponse // proses daftar akun
    {
        // Kelas & ruang wajib diisi saat daftar. Data ini jadi alamat
        // antar saat checkout, jadi tidak boleh ada yang bolong.
        $data = $request->validate( // validasi input daftar
            [
                'nis' => ['required', 'string', 'max:32', 'unique:siswa,nis'], // NIS unik
                'nama' => ['required', 'string', 'max:120'], // nama wajib
                'password' => ['required', 'confirmed', Password::min(6)], // password konfirmasi
                'tingkat' => ['required', Rule::enum(TingkatKelas::class)], // tingkat kelas enum
                'jurusan' => ['required', Rule::enum(Jurusan::class)], // jurusan enum
                'kode_kelas' => ['required', Rule::enum(KodeKelas::class)], // kode kelas enum
                'ruang' => ['required', 'string', 'max:60'], // ruang wajib
            ],
            [
                'nis.unique' => 'NIS ini sudah terdaftar. Coba masuk saja.', // pesan NIS duplikat
                'nama.required' => 'Nama belum diisi.', // pesan nama kosong
                'password.confirmed' => 'Konfirmasi kata sandi tidak sama.', // pesan konfirmasi beda
                'tingkat.required' => 'Pilih tingkat kelas.', // pesan tingkat kosong
                'jurusan.required' => 'Pilih jurusan.', // pesan jurusan kosong
                'kode_kelas.required' => 'Pilih kode kelas.', // pesan kode kelas kosong
                'ruang.required' => 'Nama ruangan belum diisi.', // pesan ruang kosong
                'ruang.max' => 'Nama ruangan terlalu panjang.', // pesan ruang kepanjangan
            ]
        );

        $siswa = Siswa::create([ // buat data siswa baru
            'nis' => trim($data['nis']), // simpan NIS tanpa spasi
            'nama' => trim($data['nama']), // simpan nama tanpa spasi
            'tingkat' => $data['tingkat'] ?? null, // simpan tingkat kelas
            'jurusan' => $data['jurusan'] ?? null, // simpan jurusan
            'kode_kelas' => $data['kode_kelas'] ?? null, // simpan kode kelas
            'ruang' => $data['ruang'] ?? null, // simpan ruang
            'password' => $data['password'], // simpan password
        ]);

        Auth::guard(self::GUARD)->login($siswa); // login otomatis siswa baru
        $request->session()->regenerate(); // regenerasi session ID

        return redirect()->route('keranjang') // redirect ke keranjang
            ->with('sukses', 'Akun dibuat. Selamat jajan, '.$siswa->nama.'!'); // pesan sukses
    }

    public function keluar(Request $request): RedirectResponse // logout siswa
    {
        Auth::guard(self::GUARD)->logout(); // logout dari guard siswa

        // Keranjang sengaja tidak dihapus: mengosongkan keranjang saat
        // logout akan terasa seperti jajan hilang, padahal isinya masih
        // aman di akun dan muncul lagi begitu siswa login kembali.
        $request->session()->invalidate(); // invalidasi session
        $request->session()->regenerateToken(); // regenerasi CSRF token

        return redirect()->route('katalog'); // redirect ke katalog
    }
}