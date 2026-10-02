@extends('layouts.admin')

{{-- Satu form untuk tambah & ubah produk. !$produk->exists menentukan
     apakah aksi menuju route store (POST) atau update (PUT). --}}
@section('judul', $produk->exists ? 'Ubah produk' : 'Tambah produk')

@section('konten')
    <p class="hero__label"><strong>Admin</strong> &middot; produk</p>
    <h1 class="admin__judul">{{ $produk->exists ? 'Ubah: '.$produk->nama : 'Produk baru' }}</h1>
    <p class="admin__sub">Foto cukup yang polos (makanannya aja, tanpa tulisan poster). Nanti tampil kotak kecil di katalog.</p>

    <form method="POST" action="{{ $aksi }}" enctype="multipart/form-data" class="admin__kartu">
        @csrf
        @method($metode)

        <div class="grup">
            <label class="label" for="nama">Nama</label>
            <input class="input" type="text" id="nama" name="nama" value="{{ old('nama', $produk->nama) }}" required maxlength="120" placeholder="Pisang Nugget Coklat Keju">
        </div>

        <div class="admin__grid">
            <div class="grup">
                <label class="label" for="kategori">Kategori</label>
                <select class="input" id="kategori" name="kategori" required>
                    @foreach (\App\Enums\Kategori::cases() as $k)
                        <option value="{{ $k->value }}" @selected(old('kategori', $produk->kategori?->value) === $k->value)>{{ $k->label() }}</option>
                    @endforeach
                </select>
            </div>

            <div class="grup">
                <label class="label" for="harga">Harga (Rp)</label>
                <input class="input" type="number" id="harga" name="harga" value="{{ old('harga', $produk->harga) }}" required min="0" max="100000000" step="500">
            </div>
        </div>

        <div class="admin__grid">
            <div class="grup">
                <label class="label" for="stok">Stok (porsi)</label>
                <input class="input" type="number" id="stok" name="stok" value="{{ old('stok', $produk->stok ?? 50) }}" required min="0" max="65535" step="1" inputmode="numeric" aria-describedby="petunjuk-stok">
                <p class="admin__sub" id="petunjuk-stok">Stok 0 = tampil “Habis”, tombol tambah mati di katalog.</p>
            </div>

            <div class="grup">
                <label class="label" for="urutan">Urutan tampil</label>
                <input class="input" type="number" id="urutan" name="urutan" value="{{ old('urutan', $produk->urutan ?? 0) }}" min="0" max="9999">
            </div>
        </div>

        <div class="grup">
            <label class="label" for="deskripsi">Deskripsi</label>
            <textarea class="input" id="deskripsi" name="deskripsi" rows="3" maxlength="2000" placeholder="Isi, topping, porsi…">{{ old('deskripsi', $produk->deskripsi) }}</textarea>
        </div>

        <div class="grup">
            <label class="label">Tag / label</label>
            @if ($tag->isEmpty())
                <p class="admin__sub">Belum ada tag. <a href="{{ route('admin.tag.index') }}">Buat tag dulu</a> kalau mau label di katalog.</p>
            @else
                <div class="tag__produk-daftar">
                    @foreach ($tag as $t)
                        <label class="tag__produk-item">
                            <input
                                type="checkbox"
                                name="tag[]"
                                value="{{ $t->id }}"
                                @checked(in_array($t->id, old('tag', $produk->exists ? $produk->tags->pluck('id')->all() : [])))
                            >
                            <span class="badge {{ $t->kelas_css }}">{{ $t->nama }}</span>
                        </label>
                    @endforeach
                </div>
            @endif
        </div>

        <div class="grup admin__cek">
            <label class="admin__ingat">
                <input type="checkbox" name="tersedia" value="1" @checked(old('tersedia', $produk->tersedia ?? true))>
                Tampilkan di katalog
            </label>
        </div>

        <div class="grup">
            <label class="label" for="gambar">Foto (polos, maks 2MB)</label>
            @if ($produk->url_gambar)
                <div class="admin__foto-besar">
                    <img src="{{ $produk->url_gambar }}" alt="Foto {{ $produk->nama }}">
                </div>
                <label class="admin__ingat">
                    <input type="checkbox" name="hapus_gambar" value="1">
                    Hapus foto ini
                </label>
            @endif
            <input class="input" type="file" id="gambar" name="gambar" accept="image/*">
        </div>

        <div class="admin__tombol">
            <a href="{{ route('admin.produk.index') }}" class="tombol">Batal</a>
            <button type="submit" class="tombol tombol--bata">{{ $produk->exists ? 'Simpan perubahan' : 'Simpan produk' }}</button>
        </div>
    </form>
@endsection
