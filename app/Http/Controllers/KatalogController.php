<?php

namespace App\Http\Controllers;

use App\Enums\Kategori; // enum daftar kategori produk
use App\Models\Product; // model produk
use Illuminate\Http\Request; // request HTTP

class KatalogController extends Controller // controller katalog produk
{
    public function index(Request $request) // tampilkan halaman katalog
    {
        $diminta = $request->query('kategori'); // ambil kategori dari URL
        $aktif = Kategori::tryFrom((string) $diminta) ?? Kategori::PisangNugget; // tentukan kategori aktif

        $produk = Product::kategori($aktif) // filter produk per kategori
            ->tersedia() // hanya produk tersedia
            ->urut() // urutkan sesuai urutan
            ->with(['tags' => fn ($q) => $q->where('tampil_katalog', true)->urut()]) // muat tag katalog
            ->get(); // ambil semua produk

        // Jumlah per kategori dihitung terpisah supaya angka di tiap tab
        // bukan cuma mengulang jumlah kategori yang sedang dibuka.
        $jumlah = Product::tersedia() // query produk tersedia
            ->selectRaw('kategori, count(*) as total') // hitung total per kategori
            ->groupBy('kategori') // kelompokkan per kategori
            ->pluck('total', 'kategori'); // petakan jumlah per kategori

        $kategoris = collect(Kategori::cases()) // kumpulkan semua kasus kategori
            ->mapWithKeys(fn (Kategori $k) => [ // petakan tiap kategori
                $k->value => ['label' => $k->label(), 'jumlah' => (int) $jumlah->get($k->value, 0)], // label dan jumlah produk
            ]);

        return view('shop.katalog', [ // tampilkan view katalog
            'produk' => $produk, // kirim data produk
            'kategoriAktif' => $aktif->value, // kirim kategori aktif
            'kategoris' => $kategoris, // kirim daftar kategori
        ]);
    }
}
