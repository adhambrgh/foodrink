<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Halaman keranjang dan perubahan isinya.
 *
 * Isi keranjang disimpan di database, jadi halaman ini di-render dari
 * server. JavaScript tetap menangani tombol tambah/kurang/hapus supaya
 * terasa cepat, tapi setiap perubahan langsung dikirim ke server dan
 * daftar yang dirender ulang selalu berasal dari server -- bukan dari
 * cache browser yang bisa sudah basi soal harga atau stok.
 */
class KeranjangController extends Controller
{
    /**
     * Halaman keranjang. Tamu (belum login) tetap boleh membuka halaman
     * ini -- isinya diambil dari cache browser lewat JS. Login baru
     * diminta saat menekan tombol bayar, bukan saat melihat keranjang.
     */
    public function index(Request $request): View
    {
        $siswa = $request->user('siswa');

        return view('shop.keranjang', [
            'cart' => $siswa ? $this->keranjangSiswa($request) : [],
            'tujuan' => $siswa?->tujuanAntar() ?? [],
            'sudahLogin' => $siswa !== null,
        ]);
    }

    /**
     * Simpan perubahan isi keranjang, lalu kirim balik isi yang benar
     * menurut server. Client tidak boleh menentukan harga maupun stok.
     * Hanya siswa yang sudah login boleh menyimpan ke database.
     */
    public function sinkron(Request $request): JsonResponse
    {
        $keranjang = $request->user('siswa')->keranjang()->firstOrCreate();
        $keranjang->isiDengan($request->json('cart', []));

        return response()->json([
            'ok' => true,
            'cart' => $keranjang->isi(),
        ]);
    }

    /**
     * @return list<array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}>
     */
    private function keranjangSiswa(Request $request): array
    {
        return $request->user('siswa')->keranjang()->firstOrCreate()->isi();
    }
}
