{{-- Layout panel admin: header dengan nav + logout, flash message, konten.
     Ditandai noindex agar tidak terindeks mesin pencari. --}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600..700&family=Plus+Jakarta+Sans:wght@400..800&display=swap" rel="stylesheet">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('judul', 'Admin') — Foodrink</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('head')
</head>
<body class="admin">
    {{-- Kepala halaman admin dengan logo dan aksi navigasi --}}
    <header class="kepala">
        <div class="bungkus admin__bungkus kepala__baris">
            <a href="{{ route('admin.produk.index') }}" class="merek" aria-label="Admin Foodrink">
                @php $logoAdmin = \App\Support\GambarBawaan::url('logo-foodrink'); @endphp
                @if ($logoAdmin)
                    <img src="{{ $logoAdmin }}" alt="Foodrink" class="merek__logo-img" width="58" height="58">
                @else
                    <span class="merek__logo" aria-hidden="true">F</span>
                @endif
            </a>

            @auth
                {{-- Di layar sempit menu jadi panel yang bisa dibuka-tutup. --}}
                <button
                    type="button"
                    class="tombol-ikon admin__menu-tombol"
                    data-menu-tombol
                    aria-expanded="false"
                    aria-controls="admin-menu"
                    aria-label="Buka menu admin"
                >
                    <x-icon name="menu" size="20" />
                </button>

                <div class="admin__nav">
                    <a href="{{ route('katalog') }}" class="tombol tombol--kecil" target="_blank" rel="noopener">Lihat katalog</a>
                    <form method="POST" action="{{ route('admin.keluar') }}" class="admin__logout">
                        @csrf
                        <button type="submit" class="tombol tombol--kecil">Keluar</button>
                    </form>
                </div>
            @endauth
        </div>
    </header>

    <div class="bungkus admin__bungkus admin__shell @auth admin__shell--sisi @endauth">
        @auth
            {{-- Sidebar: nempel di kiri di laptop, jadi lipatan di atas di HP. --}}
            <nav class="admin__sisi" id="admin-menu" aria-label="Menu admin">
                <p class="admin__sisi-judul">Menu</p>
                <a
                    href="{{ route('admin.produk.index') }}"
                    class="admin__sisi-item {{ request()->routeIs('admin.produk.*') ? 'admin__sisi-item--aktif' : '' }}"
                    @if (request()->routeIs('admin.produk.*')) aria-current="page" @endif
                >
                    <x-icon name="pisang" size="18" />
                    Produk
                </a>
                <a
                    href="{{ route('admin.tag.index') }}"
                    class="admin__sisi-item {{ request()->routeIs('admin.tag.*') ? 'admin__sisi-item--aktif' : '' }}"
                    @if (request()->routeIs('admin.tag.*')) aria-current="page" @endif
                >
                    <x-icon name="stok" size="18" />
                    Tag produk
                </a>
                <a
                    href="{{ route('admin.pesanan.index') }}"
                    class="admin__sisi-item {{ request()->routeIs('admin.pesanan.*') ? 'admin__sisi-item--aktif' : '' }}"
                    @if (request()->routeIs('admin.pesanan.*')) aria-current="page" @endif
                >
                    <x-icon name="daftar" size="18" />
                    Pesanan
                </a>
                <a
                    href="{{ route('admin.pendapatan') }}"
                    class="admin__sisi-item {{ request()->routeIs('admin.pendapatan*') ? 'admin__sisi-item--aktif' : '' }}"
                    @if (request()->routeIs('admin.pendapatan*')) aria-current="page" @endif
                >
                    <x-icon name="dompet" size="18" />
                    Pendapatan
                </a>

                <p class="admin__sisi-judul">Lainnya</p>
                <a href="{{ route('katalog') }}" class="admin__sisi-item" target="_blank" rel="noopener">
                    <x-icon name="keranjang" size="18" />
                    Lihat katalog
                </a>

                {{-- Tombol keluar khusus layar sempit: tombol keluar di header
                     (admin__nav) disembunyikan oleh media query di bawah 1024px,
                     jadi tanpa item ini admin HP tidak bisa keluar. --}}
                <form method="POST" action="{{ route('admin.keluar') }}" class="admin__sisi-keluar">
                    @csrf
                    <button type="submit" class="admin__sisi-item admin__sisi-item--bata" style="width:100%; text-align:left; border:0; background:none; cursor:pointer; font:inherit;">
                        <x-icon name="keluar" size="18" />
                        Keluar
                    </button>
                </form>
            </nav>
        @endauth

        {{-- Area konten utama admin --}}
        <main class="admin__main">
            @include('partials.flash')

            @if ($errors->any())
                <div class="flash flash--galat" role="alert">
                    <x-icon name="silang" size="18" class="flash__ikon" />
                    <span>Periksa lagi: {{ $errors->first() }}</span>
                </div>
            @endif

            @yield('konten')
        </main>
    </div>

    @stack('bawah')
</body>
</html>
