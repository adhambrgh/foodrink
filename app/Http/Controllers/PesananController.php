<?php

namespace App\Http\Controllers; // namespace kontroler

use Illuminate\Http\Request; // request HTTP

/**
 * Riwayat pesanan sisi pembeli. Setiap order menyimpan `siswa_id`, jadi
 * yang menentukan kepemilikan adalah akun yang sedang login -- riwayat
 * tetap utuh di perangkat lain tanpa perlu session browser yang sama.
 */
class PesananController extends Controller // kontroler pesanan siswa
{
    public function index(Request $request) // tampilkan daftar pesanan
    {
        $pesanan = $request->user('siswa')->orders() // ambil pesanan siswa
            ->with('items') // sertakan item pesanan
            ->latest('created_at') // urut dari terbaru
            ->get(); // ambil semua data

        return view('shop.pesanan', ['pesanan' => $pesanan]); // render view pesanan
    }

    public function show(Request $request, string $kode) // rincian satu pesanan
    {
        // Dicari lewat relasi siswa, bukan `where('kode')` lalu dibandingkan
        // di PHP: query-nya sudah tidak mungkin menyeberang ke order orang
        // lain, jadi tidak ada celah kebocoran lewat tebak kode.
        $order = $request->user('siswa')->orders() // cari lewat relasi siswa
            ->with('items') // bawa relasi item
            ->where('kode', $kode) // cocokkan kode pesanan
            ->firstOrFail(); // ambil atau 404

        return view('shop.struk', [ // render view struk
            'order' => $order, // data pesanan
            'kepala' => $order->status->label(), // judul status pesanan
            'catatan' => match (true) { // pesan catatan status
                $order->status->isTerminal() => 'Riwayat pesanan ini sudah selesai.', // pesan pesanan selesai
                // total_rupiah sudah memakai awalan "Rp".
                $order->bayarTunai() => 'Petsugas ambil duit pas antar. Bayar ' // pesan bayar tunai
                    . $order->total_rupiah . ' ya.', // sertakan nominal total
                default => 'Pesanan ini masih diproses. Cek lagi nanti ya.', // pesan pesanan diproses
            },
        ]);
    }
}
