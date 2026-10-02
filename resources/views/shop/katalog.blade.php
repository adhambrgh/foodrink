@extends('layouts.shop')

{{-- Halaman katalog (halaman depan): daftar jajan per kategori.
     Data produk & tag diambil dari server lewat KatalogController,
     tab kategori hanya menukar parameter ?kategori= pada URL. --}}
@section('judul', 'Foodrink — Pisang Nugget & Es Mamboo antar ke kelas')

@section('kelas-halaman', 'halaman-katalog')

@section('konten')
    <div class="katalog">
        <section class="hero" aria-labelledby="judul-katalog">
            <p class="hero__label">Pesan &middot; Pesen Online</p>
            <h1 id="judul-katalog" class="hero__judul">
                Pisang nugget <span class="coret">Josjis</span>,<br>
                antar ke kelas.
            </h1>
            <p class="hero__sub">
                <span>Pesan Online, tinggal nunggu diantar</span>
            </p>
            <p class="hero__coretan" aria-hidden="true">
                <svg width="34" height="16" viewBox="0 0 34 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12 C 10 4, 22 4, 32 10"/><path d="M27 6.5 32 10l-5.5 2"/></svg>
                coklat kejunya paling laris!
            </p>
        </section>

        <div class="kategori-bar">
            <nav class="katalog__tab" aria-label="Kategori produk" role="tablist">
                @foreach ($kategoris as $slug => $baris)
                    @php $aktif = $slug === $kategoriAktif; @endphp
                    <a
                        href="{{ route('katalog', ['kategori' => $slug]) }}"
                        class="katalog__tab-item {{ $aktif ? 'katalog__tab-item--aktif' : '' }}"
                        role="tab"
                        aria-selected="{{ $aktif ? 'true' : 'false' }}"
                        @if($aktif) aria-current="page" @endif
                    >{{ $baris['label'] }}<span class="katalog__tab-count">({{ $baris['jumlah'] }})</span></a>
                @endforeach
            </nav>
            <p class="kategori-bar__hint">
                @if($kategoriAktif === \App\Enums\Kategori::EsMamboo->value)
                    Yang dingin-dingin. Enak diminum jalan ke kelas.
                @else
                    Ngantuk kok turu, ngantuk yo tukuu boskuu
                @endif
            </p>

            <p class="kategori-bar__hint">
             MENU E BRO
            </p>
        </div>

        <ul class="produk-list" id="produk" role="list" aria-label="Daftar produk">
            @forelse ($produk as $index => $p)
                @php
                    $ikonThumb = $kategoriAktif === \App\Enums\Kategori::EsMamboo->value ? 'es' : 'pisang';
                    $foto = $p->foto_fallback;
                    $srcset = $p->foto_srcset;
                    $kelasStok = $p->habis ? 'produk__stok--habis' : ($p->stok <= 5 ? 'produk__stok--tipis' : 'produk__stok--aman');
                    // Tag bersorot yang bikin kartunya dibedain.
                    $disorot = $p->tags->contains(fn ($tag) => $tag->sorot);
                    $labelTampil = $p->tags->take(2);
                    $sisaLabel = $p->tags->count() - $labelTampil->count();
                @endphp
                <li class="produk produk--kartu {{ $disorot ? 'produk--jagoan' : '' }} {{ $p->habis ? 'produk--habis' : '' }}">
                    <div class="produk__thumb produk__thumb--{{ ($index % 3) + 1 }}" aria-hidden="true">
                        @if($foto)
                            <img src="{{ $foto }}" alt="" loading="{{ $index < 3 ? 'eager' : 'lazy' }}" @if($index < 3) fetchpriority="high" @endif @if($srcset) srcset="{{ $srcset }}" sizes="(max-width:640px) 50vw, 360px" @endif width="360" height="200" class="produk__img">
                        @else
                            <span class="produk__ikon-kecil"><x-icon name="{{ $ikonThumb }}" size="28" /></span>
                        @endif
                        @if ($labelTampil->isNotEmpty())
                            <div class="produk__label-luid">
                                @foreach ($labelTampil as $tag)
                                    <span class="badge {{ $tag->kelas_css }} produk__badge">{{ $tag->nama }}</span>
                                @endforeach
                                @if ($sisaLabel > 0)
                                    <span class="badge produk__badge produk__badge--sisa">+{{ $sisaLabel }}</span>
                                @endif
                            </div>
                        @endif
                    </div>

                    <div class="produk__isi">
                        <div class="produk__nama">{{ $p->nama }}</div>
                        <div class="produk__meta">{{ $p->deskripsi }}</div>
                        <div class="produk__bawah">
                            <div class="produk__jual">
                                <div class="harga produk__harga">{{ $p->harga_rupiah }}</div>
                                <div class="produk__stok {{ $kelasStok }}">{{ $p->label_stok }}</div>
                            </div>
                            <button
                                type="button"
                                class="tombol tombol--bata tombol--kecil tombol-tambah"
                                data-produk-id="{{ $p->id }}"
                                data-stok="{{ $p->stok }}"
                                aria-label="Tambah {{ $p->nama }} ke keranjang"
                                @disabled($p->habis)
                            >
                                <x-icon name="tambah" size="15" />
                                {{ $p->habis ? 'Habis' : 'Tambah' }}
                            </button>
                        </div>
                    </div>
                </li>

            @empty
                <li class="kosong kosong--kartu">
                    <div class="kosong__ikon" aria-hidden="true">
                        <x-icon name="keranjang" size="26" />
                    </div>
                    <h2>Belum ada jajan hari ini</h2>
                    <p>Coba kategori sebelah, atau jalankan <code>php artisan db:seed</code>.</p>
                </li>
            @endforelse
        </ul>

        <div class="bar-bawah bar-bawah--melayang" id="cart-summary-bar" style="display: none;" aria-live="polite">
            <div class="bar-bawah__baris bar-bawah__kartu">
                <div class="bar-bawah__info">
                    <span class="bar-bawah__ikon" aria-hidden="true">
                        <x-icon name="keranjang" size="17" />
                    </span>
                    <span class="bar-bawah__teks">
                        <span id="cart-summary-text">Keranjang kosong</span><a href="{{ route('keranjang') }}" class="bar-bawah__link">cek</a>
                    </span>
                </div>
                <a href="{{ route('keranjang') }}" class="tombol tombol--bata" id="btn-lanjut">Lanjut </a>
            </div>
        </div>
    </div>
@endsection

@push('bawah')
<script>
document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('cart-summary-bar');
    const text = document.getElementById('cart-summary-text');
    const btnLanjut = document.getElementById('btn-lanjut');

    function readCart() {
        try {
            const srv = JSON.parse(localStorage.getItem('foodrink_cart_server') || '[]');
            if (Array.isArray(srv) && srv.length) return srv;
        } catch {}
        try { return JSON.parse(localStorage.getItem('foodrink_cart') || '[]'); } catch { return []; }
    }
    function updateCartSummary(e) {
        const cart = e?.detail && Array.isArray(e.detail) ? e.detail : readCart();
        const count = cart.reduce((sum, item) => sum + item.jumlah, 0);
        const total = cart.reduce((sum, item) => sum + item.harga * item.jumlah, 0);

        if (count > 0) {
            bar.style.display = 'block';
            document.body.classList.add('ada-bar-bawah');
            text.innerHTML = `${count} jajan &middot; <span class="harga">Rp ${total.toLocaleString('id-ID')}</span>`;
            btnLanjut.href = '{{ route('keranjang') }}';
        } else {
            bar.style.display = 'none';
            document.body.classList.remove('ada-bar-bawah');
        }
    }

    updateCartSummary();
    window.addEventListener('cart:update', updateCartSummary);
    window.addEventListener('storage', (e) => {
        if (e.key === 'foodrink_cart' || e.key === 'foodrink_cart_server') updateCartSummary();
    });
});
</script>
@endpush
