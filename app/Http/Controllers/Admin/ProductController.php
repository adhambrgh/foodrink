<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Kategori;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

/**
 * CRUD katalog produk di panel admin (tambah jajan, upload foto, set stok, aktif/nonaktifkan).
 */
class ProductController extends Controller
{
    private const STOK_AWAL = 50;

    public function index(Request $request): View
    {
        $kategori = $request->query('kategori');
        $cari = $request->query('q');
        $menipis = $request->boolean('menipis');

        $produk = Product::query()
            ->when($kategori, fn ($q) => $q->where('kategori', $kategori))
            ->when($menipis, fn ($q) => $q->stokMenipis())
            ->cari($cari)
            ->orderBy('kategori')
            ->orderBy('urutan')
            ->orderBy('nama')
            ->paginate(20)
            ->withQueryString();

        return view('admin.produk.index', [
            'produk' => $produk,
            'kategoriAktif' => $kategori,
            'cari' => $cari,
            'menipis' => $menipis,
        ]);
    }

    public function create(): View
    {
        return view('admin.produk.form', [
            'produk' => new Product(['tersedia' => true, 'urutan' => 0, 'stok' => self::STOK_AWAL]),
            'tag' => Tag::urut()->get(),
            'aksi' => route('admin.produk.store'),
            'metode' => 'POST',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validasi($request);

        if ($request->hasFile('gambar')) {
            $data['gambar'] = $request->file('gambar')->store('produk', 'public');
        }

        $data['tersedia'] = $request->boolean('tersedia');
        $data['urutan'] ??= 0;

        $produk = Product::create($data);
        $produk->tags()->sync($request->input('tag', []));

        return redirect()->route('admin.produk.index')->with('sukses', 'Produk baru disimpan.');
    }

    public function edit(Product $produk): View
    {
        return view('admin.produk.form', [
            'produk' => $produk,
            'tag' => Tag::urut()->get(),
            'aksi' => route('admin.produk.update', $produk),
            'metode' => 'PUT',
        ]);
    }

    public function update(Request $request, Product $produk): RedirectResponse
    {
        $data = $this->validasi($request);

        if ($request->boolean('hapus_gambar') && $produk->gambar) {
            Storage::disk('public')->delete($produk->gambar);
            $data['gambar'] = null;
        } elseif ($request->hasFile('gambar')) {
            if ($produk->gambar) {
                Storage::disk('public')->delete($produk->gambar);
            }
            $data['gambar'] = $request->file('gambar')->store('produk', 'public');
        } else {
            unset($data['gambar']);
        }

        // Nama berubah tapi slug lama masih cocok? Biarkan.
        // Kalau slug kosong (data lama), model otomatis mengisi saat saving.
        if (($data['nama'] ?? null) !== $produk->nama && ($data['slug'] ?? null) === $produk->slug) {
            unset($data['slug']);
        }

        $data['tersedia'] = $request->boolean('tersedia');
        $data['urutan'] ??= 0;

        $produk->update($data);
        $produk->tags()->sync($request->input('tag', []));

        return redirect()->route('admin.produk.index')->with('sukses', "“{$produk->nama}” diperbarui.");
    }

    public function destroy(Product $produk): RedirectResponse
    {
        if ($produk->gambar) {
            Storage::disk('public')->delete($produk->gambar);
        }

        $nama = $produk->nama;
        $produk->delete();

        return redirect()->route('admin.produk.index')->with('sukses', "“{$nama}” dihapus.");
    }

    public function toggle(Product $produk): RedirectResponse
    {
        $produk->update(['tersedia' => ! $produk->tersedia]);

        $status = $produk->tersedia ? 'ditampilkan' : 'disembunyikan';

        return back()->with('sukses', "“{$produk->nama}” {$status} di katalog.");
    }

    /**
     * Ubah stok tanpa membuka form produk. Dipakai dari daftar admin
     * yang banyak, jadi harus cukup satu klik.
     */
    public function updateStok(Request $request, Product $produk): RedirectResponse
    {
        $data = $request->validate([
            'stok' => ['required', 'integer', 'min:0', 'max:65535'],
        ], [], ['stok' => 'stok']);

        $produk->update($data);

        return back()->with('sukses', "Stok “{$produk->nama}” jadi {$produk->stok}.");
    }

    /**
     * @return array<string, mixed>
     */
    private function validasi(Request $request): array
    {
        return $request->validate([
            'nama' => ['required', 'string', 'max:120'],
            'kategori' => ['required', Rule::enum(Kategori::class)],
            'harga' => ['required', 'integer', 'min:0', 'max:100000000'],
            'stok' => ['required', 'integer', 'min:0', 'max:65535'],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'urutan' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'gambar' => ['nullable', 'image', 'max:2048'],
            'tag' => ['nullable', 'array'],
            'tag.*' => ['integer', Rule::exists('tags', 'id')],
        ], [], [
            'nama' => 'nama',
            'kategori' => 'kategori',
            'harga' => 'harga',
            'stok' => 'stok',
            'deskripsi' => 'deskripsi',
            'urutan' => 'urutan tampil',
            'gambar' => 'foto',
            'tag' => 'tag',
        ]);
    }
}
