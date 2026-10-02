<?php

namespace App\Http\Controllers;

use App\Enums\Kategori;
use App\Models\Product;
use Illuminate\Http\Request;

class KatalogController extends Controller
{
    public function index(Request $request)
    {
        $diminta = $request->query('kategori');
        $aktif = Kategori::tryFrom((string) $diminta) ?? Kategori::PisangNugget;

        $produk = Product::kategori($aktif)
            ->tersedia()
            ->urut()
            ->with(['tags' => fn ($q) => $q->where('tampil_katalog', true)->urut()])
            ->get();

        // Jumlah per kategori dihitung terpisah supaya angka di tiap tab
        // bukan cuma mengulang jumlah kategori yang sedang dibuka.
        $jumlah = Product::tersedia()
            ->selectRaw('kategori, count(*) as total')
            ->groupBy('kategori')
            ->pluck('total', 'kategori');

        $kategoris = collect(Kategori::cases())
            ->mapWithKeys(fn (Kategori $k) => [
                $k->value => ['label' => $k->label(), 'jumlah' => (int) $jumlah->get($k->value, 0)],
            ]);

        return view('shop.katalog', [
            'produk' => $produk,
            'kategoriAktif' => $aktif->value,
            'kategoris' => $kategoris,
        ]);
    }
}
