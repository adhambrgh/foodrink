<?php

namespace App\Http\Controllers; // namespace kontrol

use Illuminate\Http\JsonResponse; // response JSON
use Illuminate\Http\Request; // request HTTP
use Illuminate\View\View; // view response

/**
 * Halaman keranjang dan perubahan isinya.
 *
 * Isi keranjang disimpan di database, jadi halaman ini di-render dari
 * server. JavaScript tetap menangani tombol tambah/kurang/hapus supaya
 * terasa cepat, tapi setiap perubahan langsung dikirim ke server dan
 * daftar yang dirender ulang selalu berasal dari server -- bukan dari
 * cache browser yang bisa sudah basi soal harga atau stok.
 */
class KeranjangController extends Controller // kontroler keranjang
{
    /**
     * Halaman keranjang. Tamu (belum login) tetap boleh membuka halaman
     * ini -- isinya diambil dari cache browser lewat JS. Login baru
     * diminta saat menekan tombol bayar, bukan saat melihat keranjang.
     */
    public function index(Request $request): View // tampilkan halaman keranjang
    {
        $siswa = $request->user('siswa'); // ambil user siswa

        return view('shop.keranjang', [ // tampilkan view keranjang
            'cart' => $siswa ? $this->keranjangSiswa($request) : [], // tampilkan keranjang atau kosong
            'tujuan' => $siswa?->tujuanAntar() ?? [], // tujuan antar jika login
            'sudahLogin' => $siswa !== null, // apakah sudah login
        ]);
    }

    /**
     * Simpan perubahan isi keranjang, lalu kirim balik isi yang benar
     * menurut server. Client tidak boleh menentukan harga maupun stok.
     * Hanya siswa yang sudah login boleh menyimpan ke database.
     */
    public function sinkron(Request $request): JsonResponse // sinkron keranjang
    {
        $keranjang = $request->user('siswa')->keranjang()->firstOrCreate(); // dapatkan atau buat keranjang
        $keranjang->isiDengan($request->json('cart', [])); // isi keranjang dari request

        return response()->json([ // balik balas JSON
            'ok' => true, // sukses
            'cart' => $keranjang->isi(), // kirim isi keranjang
        ]);
    }

    /**
     * @return list<array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}>
     */
    private function keranjangSiswa(Request $request): array // ambil isi keranjang siswa
    {
        return $request->user('siswa')->keranjang()->firstOrCreate()->isi(); // dapatkan isi keranjang
    }
}