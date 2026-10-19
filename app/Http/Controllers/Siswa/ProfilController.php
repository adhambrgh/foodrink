<?php

namespace App\Http\Controllers\Siswa; // namespace siswa

use App\Enums\Jurusan; // enum jurusan
use App\Enums\KodeKelas; // enum kode kelas
use App\Enums\TingkatKelas; // enum tingkat kelas
use App\Http\Controllers\Controller; // kontroler induk
use Illuminate\Http\RedirectResponse; // response redirect
use Illuminate\Http\Request; // request HTTP
use Illuminate\Validation\Rule; // aturan validasi
use Illuminate\View\View; // view response

/**
 * Halaman profil siswa: ubah nama + kelas/ruang tujuan antar, serta
 * riwayat pesanan terakhir. Perubahan kelas di sini otomatis muncul
 * di form pembayaran (checkout membaca dari profil yang sama).
 */
class ProfilController extends Controller // kontroler profil siswa
{
    public function index(Request $request): View // tampilkan halaman profil
    {
        return view('siswa.profil', [ // render view profil
            'siswa' => $request->user('siswa'), // data siswa login
            'tingkat' => TingkatKelas::cases(), // opsi tingkat kelas
            'jurusan' => Jurusan::cases(), // opsi jurusan
            'kodeKelas' => KodeKelas::cases(), // opsi kode kelas
            'pesanan' => $request->user('siswa')->orders()->with('items')->latest()->take(5)->get(), // 5 pesanan terakhir
        ]);
    }

    public function update(Request $request): RedirectResponse // update profil siswa
    {
        $data = $request->validate([ // validasi input profil
            'nama' => ['required', 'string', 'max:120'], // nama wajib
            'tingkat' => ['required', Rule::enum(TingkatKelas::class)], // tingkat wajib enum
            'jurusan' => ['required', Rule::enum(Jurusan::class)], // jurusan wajib enum
            'kode_kelas' => ['required', Rule::enum(KodeKelas::class)], // kode kelas wajib enum
            'ruang' => ['required', 'string', 'max:60'], // ruang wajib
        ]);

        $request->user('siswa')->update($data); // simpan perubahan profil

        return back()->with('sukses', 'Profil diperbarui.'); // redirect dengan pesan
    }
}