{{-- Layout utama sisi pembeli: header (logo, keranjang, tombol masuk/keluar),
     flash message, konten halaman, dan footer. --}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#F5EFE3">
    <meta name="description" content="Pesan pisang nugget dan es Mamboo, diantar ke kelas.">

    <title>@yield('judul', 'Foodrink')</title>

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    {{-- Font dimuat langsung dari <link>, bukan @import di CSS, supaya
         tidak menghalangi render. display=swap bikin teks langsung
         tampil pakai font sistem dulu. --}}
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600..700&family=Plus+Jakarta+Sans:wght@400..800&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    @stack('head')
</head>
<body @yield('atribut-body')>
    @php
        // Task 7 akan menyuntikkan angka ini lewat view composer.
        // Default 0 supaya halaman tidak error sebelum keranjang ada.
        $jumlahKeranjang = $jumlahKeranjang ?? 0;
    @endphp

    <header class="kepala">
        <div class="bungkus kepala__baris">
            <a href="{{ route('katalog') }}" class="merek" aria-label="Foodrink - kembali ke katalog">
                @php $logo = \App\Support\GambarBawaan::url('logo-foodrink'); @endphp
                @if ($logo)
                    <img src="{{ $logo }}" alt="Foodrink" class="merek__logo-img" width="52" height="52">
                @else
                    <span class="merek__logo" aria-hidden="true">F</span>
                @endif
                <span class="merek__teks">
                    <span class="merek__nama">Foodrink</span>
                    <span class="merek__tagline">foodrink (jajanan kelas yoi)</span>
                </span>
            </a>

            <nav class="kepala__aksi" aria-label="Aksi keranjang & akun">
                <a href="{{ route('siswa.profil') }}" class="tombol-ikon kepala__ikon" aria-label="Profil / akun">
                    <x-icon name="profil" size="20" />
                </a>

                <a href="{{ route('keranjang') }}" class="tombol-ikon kepala__ikon kepala__ikon--keranjang keranjang-tombol" aria-label="Lihat keranjang belanja">
                    <x-icon name="keranjang" size="20" />
                    @if ($jumlahKeranjang > 0)
                        <span class="lencana">{{ $jumlahKeranjang }}</span>
                        <span class="hanya-layar-baca">{{ $jumlahKeranjang }} item di keranjang</span>
                    @endif
                </a>

                <a href="{{ route('katalog') }}#produk" class="tombol-ikon kepala__ikon" aria-label="Lihat katalog produk">
                    <x-icon name="daftar" size="20" />
                </a>

                @auth('siswa')
                    {{-- Badge berisi pesanan yang belum selesai. Dipakai
                         auth() helper, bukan $request, karena view tidak
                         otomatis menerima instance request. --}}
                    @php
                        $aktif = auth('siswa')->user()
                            ->orders()
                            ->whereNotIn('status', [
                                \App\Enums\StatusOrder::Selesai,
                                \App\Enums\StatusOrder::Batal,
                            ])
                            ->count();
                    @endphp
                    <a href="{{ route('pesanan.index') }}" class="tombol-ikon kepala__ikon" aria-label="Pesanan saya">
                        <x-icon name="pesanan" size="20" />
                        <span class="lencana" style="top: -2px; right: -2px; font-size: 0.6rem;">{{ $aktif }}</span>
                    </a>
                @else
                    <a href="{{ route('siswa.masuk') }}" class="tombol-ikon kepala__ikon" aria-label="Masuk ke akun">
                        <x-icon name="masuk" size="20" />
                    </a>
                @endauth
            </nav>
        </div>
    </header>

    <main class="bungkus @yield('kelas-halaman')">
        @include('partials.flash')

        @yield('konten')
    </main>

    <footer class="kaki">
        <div class="bungkus kaki__isi">
            <div class="kaki__merek">
                @php $logoKaki = \App\Support\GambarBawaan::url('logo-foodrink'); @endphp
                @if ($logoKaki)
                    <img src="{{ $logoKaki }}" alt="Foodrink" class="merek__logo-img merek__logo-img--kecil" width="42" height="42">
                @else
                    <span class="merek__logo merek__logo--kecil" aria-hidden="true">F</span>
                @endif
                <div class="kaki__merek-teks">
                    <p class="kaki__tagline">Foodrink — jajanan kelas yoi</p>
                    <p class="kaki__teks">gak usah ruwet, beli online, jam istirahat langsung tak kirim</p>
                </div>
            </div>

            <div class="kaki__meta">
                <span class="badge badge--kuning">Istirahat 1 &amp; Istirahat 2</span>
                <span class="badge badge--hijau">Antar ke kelas</span>
            </div>

            <p class="kaki__copyright">&copy; {{ date('Y') }} Foodrink</p>
        </div>
    </footer>

    @stack('bawah')
</body>
</html>
