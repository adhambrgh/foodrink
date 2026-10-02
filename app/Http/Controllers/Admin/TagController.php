<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WarnaTag;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

/**
 * Tag=jualan yang nempel di kartu produk katalog ("Paling laris",
 * "Musiman", dll). Admin yang tentukan sendiri lewat halaman ini, lalu
 * memilih produk mana yang boleh pakai tag tersebut.
 */
class TagController extends Controller
{
    public function index(): View
    {
        return view('admin.tag.index', [
            'tag' => Tag::urut()->with('products')->withCount('products')->get(),
            'produk' => Product::urut()->get(['id', 'nama']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validasi($request);

        Tag::create($data);

        return back()->with('sukses', "Tag “{$data['nama']}” dibuat. Centang produk yang mau diberi tag ini.");
    }

    public function update(Request $request, Tag $tag): RedirectResponse
    {
        $tag->update($this->validasi($request, $tag));

        return back()->with('sukses', "Tag “{$tag->nama}” diperbarui.");
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        $nama = $tag->nama;
        $tag->delete();

        return redirect()
            ->route('admin.tag.index')
            ->with('sukses', "Tag “{$nama}” dihapus dari semua produk.");
    }

    /**
     * Pilih produk yang memakai satu tag. Dipisah dari update() supaya
     * admin bisa sering mengubah daftar produk tanpa menyentuh nama tag.
     */
    public function produk(Request $request, Tag $tag): RedirectResponse
    {
        $data = $request->validate([
            'produk' => ['nullable', 'array'],
            'produk.*' => ['integer', Rule::exists('products', 'id')],
        ], [], ['produk' => 'produk']);

        $terpilih = $data['produk'] ?? [];
        $tag->products()->sync($terpilih);

        $jumlah = count($terpilih);

        return back()->with(
            'sukses',
            $jumlah === 0
                ? "Tag “{$tag->nama}” sekarang tidak dipakai produk mana pun."
                : "Tag “{$tag->nama}” dipakai {$jumlah} produk."
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validasi(Request $request, ?Tag $tag = null): array
    {
        $data = $request->validate([
            'nama' => [
                'required',
                'string',
                'max:40',
                Rule::unique('tags', 'nama')->ignore($tag?->id),
            ],
            'warna' => ['required', Rule::enum(WarnaTag::class)],
            'urutan' => ['nullable', 'integer', 'min:0', 'max:999'],
        ], [], [
            'nama' => 'nama tag',
            'warna' => 'warna',
            'urutan' => 'urutan tampil',
        ]);

        $data['tampil_katalog'] = $request->boolean('tampil_katalog');
        $data['sorot'] = $request->boolean('sorot');
        $data['urutan'] ??= 0;

        return $data;
    }
}
