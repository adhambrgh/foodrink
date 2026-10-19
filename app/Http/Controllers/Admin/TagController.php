<?php

namespace App\Http\Controllers\Admin; // namespace admin

use App\Enums\WarnaTag; // enum warna tag
use App\Http\Controllers\Controller; // kontroler induk
use App\Models\Product; // model produk
use App\Models\Tag; // model tag
use Illuminate\Http\RedirectResponse; // response redirect
use Illuminate\Http\Request; // request HTTP
use Illuminate\Validation\Rule; // aturan validasi
use Illuminate\View\View; // view response

/**
 * Tag=jualan yang nempel di kartu produk katalog ("Paling laris",
 * "Musiman", dll). Admin yang tentukan sendiri lewat halaman ini, lalu
 * memilih produk mana yang boleh pakai tag tersebut.
 */
class TagController extends Controller // kontroler tag admin
{
    public function index(): View // daftar tag dan produk
    {
        return view('admin.tag.index', [ // render view tag
            'tag' => Tag::urut()->with('products')->withCount('products')->get(), // ambil tag terurut
            'produk' => Product::urut()->get(['id', 'nama']), // ambil produk ringkas
        ]);
    }

    public function store(Request $request): RedirectResponse // buat tag baru
    {
        $data = $this->validasi($request); // validasi input

        Tag::create($data); // simpan tag baru

        return back()->with('sukses', "Tag “{$data['nama']}” dibuat. Centang produk yang mau diberi tag ini."); // redirect sukses
    }

    public function update(Request $request, Tag $tag): RedirectResponse // update tag
    {
        $tag->update($this->validasi($request, $tag)); // simpan perubahan tag

        return back()->with('sukses', "Tag “{$tag->nama}” diperbarui."); // redirect sukses
    }

    public function destroy(Tag $tag): RedirectResponse // hapus tag
    {
        $nama = $tag->nama; // simpan nama tag
        $tag->delete(); // hapus tag dari DB

        return redirect()
            ->route('admin.tag.index') // kembali ke daftar tag
            ->with('sukses', "Tag “{$nama}” dihapus dari semua produk."); // pesan sukses
    }

    /**
     * Pilih produk yang memakai satu tag. Dipisah dari update() supaya
     * admin bisa sering mengubah daftar produk tanpa menyentuh nama tag.
     */
    public function produk(Request $request, Tag $tag): RedirectResponse // atur produk pakai tag
    {
        $data = $request->validate([ // validasi produk terpilih
            'produk' => ['nullable', 'array'], // array produk opsional
            'produk.*' => ['integer', Rule::exists('products', 'id')], // id produk valid
        ], [], ['produk' => 'produk']); // label produk

        $terpilih = $data['produk'] ?? []; // ambil daftar terpilih
        $tag->products()->sync($terpilih); // sinkron relasi produk

        $jumlah = count($terpilih); // hitung jumlah terpilih

        return back()->with( // redirect balik
            'sukses',
            $jumlah === 0 // cek kosong
                ? "Tag “{$tag->nama}” sekarang tidak dipakai produk mana pun." // pesan kosong
                : "Tag “{$tag->nama}” dipakai {$jumlah} produk." // pesan terpakai
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validasi(Request $request, ?Tag $tag = null): array // validasi data tag
    {
        $data = $request->validate([ // validasi input
            'nama' => [ // field nama
                'required', // wajib diisi
                'string', // harus teks
                'max:40', // maks 40 karakter
                Rule::unique('tags', 'nama')->ignore($tag?->id), // unik kecuali diri sendiri
            ],
            'warna' => ['required', Rule::enum(WarnaTag::class)], // warna harus enum valid
            'urutan' => ['nullable', 'integer', 'min:0', 'max:999'], // urutan opsional
        ], [], [
            'nama' => 'nama tag', // label nama
            'warna' => 'warna', // label warna
            'urutan' => 'urutan tampil', // label urutan
        ]);

        $data['tampil_katalog'] = $request->boolean('tampil_katalog'); // toggle tampil katalog
        $data['sorot'] = $request->boolean('sorot'); // toggle sorot
        $data['urutan'] ??= 0; // default urutan nol

        return $data; // kembalikan data valid
    }
}
