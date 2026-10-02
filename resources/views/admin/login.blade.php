@extends('layouts.admin')

{{-- Form login petugas/admin. Dilindungi CSRF token & rate limiter. --}}
@section('judul', 'Masuk admin')

@section('konten')
    <div class="admin__sempit">
        {{-- Brand sudah ada di header layout, jadi halaman ini tidak
             mengulang logo + tulisan "Admin" lagi. --}}
        <h1 class="admin__judul">Masuk</h1>
        <p class="admin__sub">Khusus petugas penjual Foodrink.</p>

        <form method="POST" action="{{ route('admin.masuk') }}" class="admin__kartu">
            @csrf

            <div class="grup">
                <label class="label" for="email">Email / nama admin</label>
                <input class="input" type="text" id="email" name="email" value="{{ old('email') }}" required autofocus
                    autocomplete="username" placeholder="admin@sekolah.sch.id">
            </div>

            <div class="grup">
                <label class="label" for="password">Kata sandi</label>
                <input class="input" type="password" id="password" name="password" required autocomplete="current-password"
                    placeholder="••••••">
            </div>

            <label class="admin__ingat">
                <input type="checkbox" name="ingat" value="1" {{ old('ingat') ? 'checked' : '' }}>
                Ingat saya
            </label>

            <button type="submit" class="tombol tombol--bata tombol--penuh">Masuk</button>
        </form>

        <p class="admin__kembali">
            <a href="{{ route('katalog') }}" target="_blank" rel="noopener">
                <x-icon name="chevron" size="14" />
                Lihat katalog publik
            </a>
        </p>
    </div>
@endsection