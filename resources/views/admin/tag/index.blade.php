@extends('layouts.admin')

{{-- Manajemen label produk (mis. "Paling Laris", "Promo"). Terhubung ke
     produk lewat tabel pivot product_tag, diatur langsung dari daftar. --}}
@section('judul', 'Tag')

@section('konten')
    <div class="admin__kepala">
        <div>
            <p class="hero__label"><strong>Admin</strong> &middot; tag produk</p>
            <h1 class="admin__judul">Label di katalog</h1>
        </div>
    </div>
    <p class="admin__sub">
        Tag itu label kecil di kartu jajan, misalnya “Paling laris” atau “Musiman”.
        Buat tag di sini, lalu centang produk yang boleh memakainya. Tag dengan
        <strong>sorot</strong> juga membuat kartunya dibedain di katalog.
    </p>

    <section class="admin__kartu" aria-labelledby="judul-tag-baru">
        <h2 class="tag__judul" id="judul-tag-baru">Tag baru</h2>
        <form method="POST" action="{{ route('admin.tag.store') }}" class="tag__form">
            @csrf
            <div class="grup">
                <label class="label" for="nama-tag">Nama tag</label>
                <input
                    class="input"
                    type="text"
                    id="nama-tag"
                    name="nama"
                    value="{{ old('nama') }}"
                    required
                    maxlength="40"
                    placeholder="Paling laris"
                >
            </div>

            <div class="grup">
                <label class="label" for="warna-tag">Warna</label>
                <select class="input" id="warna-tag" name="warna" required>
                    @foreach (\App\Enums\WarnaTag::cases() as $w)
                        <option value="{{ $w->value }}" @selected(old('warna', 'bata') === $w->value)>{{ $w->label() }}</option>
                    @endforeach
                </select>
            </div>

            <div class="grup">
                <label class="label" for="urutan-tag">Urutan tampil</label>
                <input class="input" type="number" id="urutan-tag" name="urutan" value="{{ old('urutan', 0) }}" min="0" max="999">
            </div>

            <div class="grup tag__cek">
                <label class="admin__ingat">
                    <input type="checkbox" name="tampil_katalog" value="1" @checked(old('tampil_katalog', true))>
                    Tampil di katalog
                </label>
                <label class="admin__ingat">
                    <input type="checkbox" name="sorot" value="1" @checked(old('sorot'))>
                    Sorot (kartu dibedain)
                </label>
            </div>

            <button type="submit" class="tombol tombol--bata">Buat tag</button>
        </form>
    </section>

    @forelse ($tag as $t)
        <section class="admin__kartu tag__kartu" aria-labelledby="tag-{{ $t->id }}">
            <div class="tag__kepala">
                <span class="badge {{ $t->kelas_css }}">{{ $t->nama }}</span>
                <span class="admin__sub">
                    {{ $t->products_count }} produk
                    @unless ($t->tampil_katalog) &middot; disembunyikan di katalog @endunless
                    @if ($t->sorot) &middot; sorot @endif
                </span>
            </div>

            <details class="tag__rincian">
                <summary class="tag__rincian-tutup">Ubah nama, warna, dan produknya</summary>

                <form method="POST" action="{{ route('admin.tag.update', $t) }}" class="tag__form">
                    @csrf
                    @method('PUT')
                    <div class="grup">
                        <label class="label" for="nama-{{ $t->id }}">Nama tag</label>
                        <input
                            class="input"
                            type="text"
                            id="nama-{{ $t->id }}"
                            name="nama"
                            value="{{ old("tag.{$t->id}.nama", $t->nama) }}"
                            required
                            maxlength="40"
                        >
                    </div>

                    <div class="grup">
                        <label class="label" for="warna-{{ $t->id }}">Warna</label>
                        <select class="input" id="warna-{{ $t->id }}" name="warna" required>
                            @foreach (\App\Enums\WarnaTag::cases() as $w)
                                <option value="{{ $w->value }}" @selected(old("tag.{$t->id}.warna", $t->warna->value) === $w->value)>{{ $w->label() }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="grup">
                        <label class="label" for="urutan-{{ $t->id }}">Urutan tampil</label>
                        <input
                            class="input"
                            type="number"
                            id="urutan-{{ $t->id }}"
                            name="urutan"
                            value="{{ old("tag.{$t->id}.urutan", $t->urutan) }}"
                            min="0"
                            max="999"
                        >
                    </div>

                    <div class="grup tag__cek">
                        <label class="admin__ingat">
                            <input type="checkbox" name="tampil_katalog" value="1" @checked(old("tag.{$t->id}.tampil_katalog", $t->tampil_katalog))>
                            Tampil di katalog
                        </label>
                        <label class="admin__ingat">
                            <input type="checkbox" name="sorot" value="1" @checked(old("tag.{$t->id}.sorot", $t->sorot))>
                            Sorot (kartu dibedain)
                        </label>
                    </div>

                    <div class="admin__tombol">
                        <button type="submit" class="tombol">Simpan perubahan</button>
                    </div>
                </form>

                <form method="POST" action="{{ route('admin.tag.produk', $t) }}">
                    @csrf
                    @method('PUT')
                    <fieldset class="tag__produk">
                        <legend class="label">Produk yang memakai tag ini</legend>
                        @if ($produk->isEmpty())
                            <p class="admin__sub">Belum ada produk di katalog.</p>
                        @else
                            <div class="tag__produk-daftar">
                                @foreach ($produk as $p)
                                    <label class="tag__produk-item">
                                        <input
                                            type="checkbox"
                                            name="produk[]"
                                            value="{{ $p->id }}"
                                            @checked($t->products->contains('id', $p->id))
                                        >
                                        <span>{{ $p->nama }}</span>
                                    </label>
                                @endforeach
                            </div>
                            <button type="submit" class="tombol tombol--kecil">Simpan pilihan produk</button>
                        @endif
                    </fieldset>
                </form>
            </details>

            <form
                method="POST"
                action="{{ route('admin.tag.destroy', $t) }}"
                class="tag__hapus"
                onsubmit="return confirm('Hapus tag “{{ addslashes($t->nama) }}”? Tag ini akan lepas dari semua produk.')"
            >
                @csrf
                @method('DELETE')
                <button type="submit" class="tombol tombol--kecil tombol--bahaya">Hapus tag</button>
            </form>
        </section>
    @empty
        <section class="admin__kartu">
            <h2 class="tag__judul">Belum ada tag</h2>
            <p class="admin__sub">Buat tag pertama di atas, lalu centang produk yang mau diberi label.</p>
        </section>
    @endforelse
@endsection
