{{-- Pakai kerangka admin --}}
@extends('layouts.admin')

{{-- Daftar & pencarian produk untuk admin: filter kategori, cari nama,
     filter stok menipis, toggle tersedia, ubah stok cepat, hapus. --}}
@section('judul', 'Produk')

@section('konten')
    <div class="admin__kepala">
        <div>
            <p class="hero__label"><strong>Admin</strong> &middot; produk ({{ $produk->total() }})</p>
            <h1 class="admin__judul">Jajan apa aja hari ini?</h1>
        </div>
        <a href="{{ route('admin.produk.create') }}" class="tombol tombol--bata">+ Tambah produk</a>
    </div>

    {{-- Form cari nama dan stok menipis --}}
    <form method="GET" action="{{ route('admin.produk.index') }}" class="admin__cari">
        <label class="hanya-layar-baca" for="q">Cari produk</label>
        <div class="admin__cari-field">
            <x-icon name="cari" size="18" class="admin__cari-ikon" />
            <input
                class="input admin__cari-input"
                type="search"
                id="q"
                name="q"
                value="{{ $cari }}"
                placeholder="Cari nama produk&hellip;"
            >
        </div>
        <input type="hidden" name="kategori" value="{{ $kategoriAktif }}">
        <label class="admin__ingat admin__cari-menyipis">
            <input type="checkbox" name="menipis" value="1" @checked($menipis)>
            Stok menipis
        </label>
        <button type="submit" class="tombol tombol--kecil">Terapkan</button>
    </form>

    {{-- Tab saring kategori produk --}}
    <nav class="admin__filter" aria-label="Saring kategori">
        <a
            href="{{ route('admin.produk.index', array_filter(['q' => $cari, 'menipis' => $menipis ? 1 : null])) }}"
            class="katalog__tab-item {{ ! $kategoriAktif ? 'katalog__tab-item--aktif' : '' }}"
        >Semua</a>
        @foreach (\App\Enums\Kategori::cases() as $k)
            <a
                href="{{ route('admin.produk.index', array_filter(['kategori' => $k->value, 'q' => $cari, 'menipis' => $menipis ? 1 : null])) }}"
                class="katalog__tab-item {{ $kategoriAktif === $k->value ? 'katalog__tab-item--aktif' : '' }}"
            >{{ $k->label() }}</a>
        @endforeach
    </nav>

    {{-- Daftar baris produk admin --}}
    <ul class="admin__list" role="list">
        @forelse ($produk as $p)
            @php $kelasStok = $p->stok <= 0 ? 'stok--habis' : ($p->stok <= 5 ? 'stok--tipis' : 'stok--aman'); @endphp
            <li class="admin__item {{ ! $p->tersedia ? 'admin__item--mati' : '' }}">
                <div class="admin__foto" aria-hidden="true">
                    @if ($p->foto_fallback)
                        <img src="{{ $p->foto_fallback }}" alt="" loading="lazy">
                    @else
                        <x-icon name="{{ $p->kategori === \App\Enums\Kategori::EsMamboo ? 'es' : 'pisang' }}" size="24" />
                    @endif
                </div>

                <div class="admin__isi">
                    <div class="admin__nama">
                        {{ $p->nama }}
                        @if (! $p->tersedia)
                            <span class="badge">disembunyikan</span>
                        @endif
                    </div>
                    <div class="admin__meta">
                        {{ $p->kategori->label() }} &middot; urutan {{ $p->urutan }} &middot;
                        <span class="harga">{{ $p->harga_rupiah }}</span>
                    </div>
                    @if ($p->deskripsi)
                        <div class="admin__deskripsi">{{ \Illuminate\Support\Str::limit($p->deskripsi, 90) }}</div>
                    @endif
                </div>

                {{-- Editor stok: ubah angka lalu Enter, tanpa buka form produk. --}}
                <form method="POST" action="{{ route('admin.produk.stok', $p) }}" class="admin__stok-form">
                    @csrf
                    @method('PATCH')
                    <label class="admin__stok-label" for="stok-{{ $p->id }}">Stok</label>
                    <div class="admin__stok-baris">
                        <input
                            class="input admin__stok-input {{ $kelasStok }}"
                            type="number"
                            id="stok-{{ $p->id }}"
                            name="stok"
                            value="{{ $p->stok }}"
                            min="0"
                            max="65535"
                            inputmode="numeric"
                        >
                        <button type="submit" class="tombol tombol--kecil">Simpan</button>
                    </div>
                    <p class="admin__stok-sisa {{ $kelasStok }}">{{ $p->label_stok }}</p>
                </form>

                <div class="admin__aksi">
                    <form method="POST" action="{{ route('admin.produk.toggle', $p) }}">
                        @csrf
                        <button type="submit" class="tombol tombol--kecil" title="{{ $p->tersedia ? 'Sembunyikan dari katalog' : 'Tampilkan di katalog' }}">
                            {{ $p->tersedia ? 'Sembunyikan' : 'Tampilkan' }}
                        </button>
                    </form>
                    <a href="{{ route('admin.produk.edit', $p) }}" class="tombol tombol--kecil">Ubah</a>
                    <form
                        method="POST"
                        action="{{ route('admin.produk.destroy', $p) }}"
                        onsubmit="return confirm('Hapus “{{ addslashes($p->nama) }}” dari katalog?')"
                    >
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="tombol tombol--kecil tombol--bahaya">Hapus</button>
                    </form>
                </div>
            </li>
        @empty
            <li class="kosong kosong--kartu">
                <h2>{{ $cari || $menipis ? 'Tidak ada produk yang cocok' : 'Belum ada produk' }}</h2>
                <p>
                    @if ($cari || $menipis)
                        Ubah kata kunci atau matikan filter stok menipis.
                    @else
                        Tambah produk pertama lewat tombol di atas.
                    @endif
                </p>
            </li>
        @endforelse
    </ul>

    <div class="admin__paging">
        {{ $produk->links() }}
    </div>
@endsection
