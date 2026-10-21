<?php

namespace App\Http\Controllers\Admin; // namespace admin

use App\Enums\Kategori; // enum kategori produk
use App\Http\Controllers\Controller; // kontroler induk
use App\Models\Product; // model produk
use App\Models\Tag; // model tag
use Illuminate\Http\RedirectResponse; // response redirect
use Illuminate\Http\Request; // request HTTP
use Illuminate\Support\Facades\Storage; // facade Storage
use Illuminate\Validation\Rule; // aturan validasi
use Illuminate\View\View; // view response

/**
 * CRUD katalog produk di panel admin (tambah jajan, upload foto, set stok, aktif/nonaktifkan).
 */
class ProductController extends Controller // kontroler produk admin
{
    private const STOK_AWAL = 50; // stok default baru

    public function index(Request $request): View // daftar produk admin
    {
        $kategori = $request->query('kategori'); // filter kategori
        $cari = $request->query('q'); // kata kunci cari
        $menipis = $request->boolean('menipis'); // filter stok menipis

        $produk = Product::query() // query produk
            ->when($kategori, fn ($q) => $q->where('kategori', $kategori)) // filter kategori
            ->when($menipis, fn ($q) => $q->stokMenipis()) // filter menipis
            ->cari($cari) // pencarian nama
            ->orderBy('kategori') // urut kategori
            ->orderBy('urutan') // urut urutan
            ->orderBy('nama') // urut nama
            ->paginate(20) // paginasi 20
            ->withQueryString(); // pertahankan query

        return view('admin.produk.index', [ // render view daftar
            'produk' => $produk, // data produk
            'kategoriAktif' => $kategori, // kategori aktif
            'cari' => $cari, // kata kunci
            'menipis' => $menipis, // filter menipis
        ]);
    }

    public function create(): View // form tambah produk
    {
        return view('admin.produk.form', [ // render form produk
            'produk' => new Product(['tersedia' => true, 'urutan' => 0, 'stok' => self::STOK_AWAL]), // produk baru default
            'tag' => Tag::urut()->get(), // daftar tag
            'aksi' => route('admin.produk.store'), // URL simpan
            'metode' => 'POST', // method POST
        ]);
    }

    public function store(Request $request): RedirectResponse // simpan produk baru
    {
        $data = $this->validasi($request); // validasi input

        if ($request->hasFile('gambar')) { // cek ada file gambar
            $data['gambar'] = $request->file('gambar')->store('produk'); // upload gambar ke disk default
        }

        $data['tersedia'] = $request->boolean('tersedia'); // konversi boolean
        $data['urutan'] ??= 0; // default urutan

        $produk = Product::create($data); // buat produk
        $produk->tags()->sync($request->input('tag', [])); // sinkron tag

        return redirect()->route('admin.produk.index')->with('sukses', 'Produk baru disimpan.'); // redirect sukses
    }

    public function edit(Product $produk): View // form edit produk
    {
        return view('admin.produk.form', [ // render form edit
            'produk' => $produk, // data produk
            'tag' => Tag::urut()->get(), // daftar tag
            'aksi' => route('admin.produk.update', $produk), // URL update
            'metode' => 'PUT', // method PUT
        ]);
    }

    public function update(Request $request, Product $produk): RedirectResponse // update produk
    {
        $data = $this->validasi($request); // validasi input

        if ($request->boolean('hapus_gambar') && $produk->gambar) { // cek hapus gambar
            Storage::delete($produk->gambar); // hapus file lama
            $data['gambar'] = null; // kosongkan gambar
        } elseif ($request->hasFile('gambar')) { // cek upload baru
            if ($produk->gambar) { // ada gambar lama
                Storage::delete($produk->gambar); // hapus lama
            }
            $data['gambar'] = $request->file('gambar')->store('produk'); // upload baru ke disk default
        } else { // tidak ubah gambar
            unset($data['gambar']); // biarkan gambar lama
        }

        // Nama berubah tapi slug lama masih cocok? Biarkan.
        // Kalau slug kosong (data lama), model otomatis mengisi saat saving.
        if (($data['nama'] ?? null) !== $produk->nama && ($data['slug'] ?? null) === $produk->slug) { // cek nama berubah slug tidak
            unset($data['slug']); // hapus slug agar otomatis
        }

        $data['tersedia'] = $request->boolean('tersedia'); // konversi boolean
        $data['urutan'] ??= 0; // default urutan

        $produk->update($data); // simpan perubahan
        $produk->tags()->sync($request->input('tag', [])); // sinkron tag

        return redirect()->route('admin.produk.index')->with('sukses', "“{$produk->nama}” diperbarui."); // redirect sukses
    }

    public function destroy(Product $produk): RedirectResponse // hapus produk
    {
        if ($produk->gambar) { // cek ada gambar
            Storage::delete($produk->gambar); // hapus file gambar
        }

        $nama = $produk->nama; // simpan nama
        $produk->delete(); // hapus produk

        return redirect()->route('admin.produk.index')->with('sukses', "“{$nama}” dihapus."); // redirect sukses
    }

    public function toggle(Product $produk): RedirectResponse // toggle aktif produk
    {
        $produk->update(['tersedia' => ! $produk->tersedia]); // balik status tersedia

        $status = $produk->tersedia ? 'ditampilkan' : 'disembunyikan'; // label status

        return back()->with('sukses', "“{$produk->nama}” {$status} di katalog."); // kembali dengan pesan
    }

    /**
     * Ubah stok tanpa membuka form produk. Dipakai dari daftar admin
     * yang banyak, jadi harus cukup satu klik.
     */
    public function updateStok(Request $request, Product $produk): RedirectResponse // update stok cepat
    {
        $data = $request->validate([ // validasi stok
            'stok' => ['required', 'integer', 'min:0', 'max:65535'], // stok integer
        ], [], ['stok' => 'stok']); // label stok

        $produk->update($data); // simpan stok baru

        return back()->with('sukses', "Stok “{$produk->nama}” jadi {$produk->stok}."); // kembali dengan pesan
    }

    /**
     * @return array<string, mixed>
     */
    private function validasi(Request $request): array // validasi produk
    {
        return $request->validate([ // aturan validasi
            'nama' => ['required', 'string', 'max:120'], // nama wajib
            'kategori' => ['required', Rule::enum(Kategori::class)], // kategori enum
            'harga' => ['required', 'integer', 'min:0', 'max:100000000'], // harga wajib
            'stok' => ['required', 'integer', 'min:0', 'max:65535'], // stok wajib
            'deskripsi' => ['nullable', 'string', 'max:2000'], // deskripsi opsional
            'urutan' => ['nullable', 'integer', 'min:0', 'max:9999'], // urutan opsional
            'gambar' => ['nullable', 'image', 'max:2048'], // gambar opsional max 2MB
            'tag' => ['nullable', 'array'], // tag array opsional
            'tag.*' => ['integer', Rule::exists('tags', 'id')], // tag id valid
        ], [], [
            'nama' => 'nama', // label nama
            'kategori' => 'kategori', // label kategori
            'harga' => 'harga', // label harga
            'stok' => 'stok', // label stok
            'deskripsi' => 'deskripsi', // label deskripsi
            'urutan' => 'urutan tampil', // label urutan
            'gambar' => 'foto', // label gambar
            'tag' => 'tag', // label tag
        ]);
    }
}
