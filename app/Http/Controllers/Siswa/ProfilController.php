<?php

namespace App\Http\Controllers\Siswa;

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\TingkatKelas;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

/**
 * Halaman profil siswa: ubah nama + kelas/ruang tujuan antar, serta
 * riwayat pesanan terakhir. Perubahan kelas di sini otomatis muncul
 * di form pembayaran (checkout membaca dari profil yang sama).
 */
class ProfilController extends Controller
{
    public function index(Request $request): View
    {
        return view('siswa.profil', [
            'siswa' => $request->user('siswa'),
            'tingkat' => TingkatKelas::cases(),
            'jurusan' => Jurusan::cases(),
            'kodeKelas' => KodeKelas::cases(),
            'pesanan' => $request->user('siswa')->orders()->with('items')->latest()->take(5)->get(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:120'],
            'tingkat' => ['required', Rule::enum(TingkatKelas::class)],
            'jurusan' => ['required', Rule::enum(Jurusan::class)],
            'kode_kelas' => ['required', Rule::enum(KodeKelas::class)],
            'ruang' => ['required', 'string', 'max:60'],
        ]);

        $request->user('siswa')->update($data);

        return back()->with('sukses', 'Profil diperbarui.');
    }
}
