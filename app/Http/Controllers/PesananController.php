<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Riwayat pesanan sisi pembeli. Setiap order menyimpan `siswa_id`, jadi
 * yang menentukan kepemilikan adalah akun yang sedang login -- riwayat
 * tetap utuh di perangkat lain tanpa perlu session browser yang sama.
 */
class PesananController extends Controller
{
    public function index(Request $request)
    {
        $pesanan = $request->user('siswa')->orders()
            ->with('items')
            ->latest('created_at')
            ->get();

        return view('shop.pesanan', ['pesanan' => $pesanan]);
    }

    public function show(Request $request, string $kode)
    {
        // Dicari lewat relasi siswa, bukan `where('kode')` lalu dibandingkan
        // di PHP: query-nya sudah tidak mungkin menyeberang ke order orang
        // lain, jadi tidak ada celah kebocoran lewat tebak kode.
        $order = $request->user('siswa')->orders()
            ->with('items')
            ->where('kode', $kode)
            ->firstOrFail();

        return view('shop.struk', [
            'order' => $order,
            'kepala' => $order->status->label(),
            'catatan' => match (true) {
                $order->status->isTerminal() => 'Riwayat pesanan ini sudah selesai.',
                // total_rupiah sudah memakai awalan "Rp".
                $order->bayarTunai() => 'Petsugas ambil duit pas antar. Bayar '
                    . $order->total_rupiah . ' ya.',
                default => 'Pesanan ini masih diproses. Cek lagi nanti ya.',
            },
        ]);
    }
}
