{{-- Pakai kerangka toko --}}
@extends('layouts.shop')

{{-- Form login siswa memakai NIS + kata sandi (guard `siswa`).
     Berbeda dari admin yang login dengan email. --}}
@section('judul', 'Masuk')

@section('konten')
    {{-- Wadah halaman masuk siswa --}}
    <div class="akun">
        <p class="hero__label"><strong>Siswa</strong> &middot; buat akun dulu</p>
        <h1 class="akun__judul">Masuk</h1>
        <p class="akun__santai">
            Pake NIS sekolah sama kata sandi. Kalau belum punya, daftar dulu ya.
        </p>

        {{-- Daftar seluruh pesan error validasi --}}
        @if ($errors->any())
            <div class="kartu kartu--galat" role="alert">
                <ul class="galat-daftar">
                    @foreach ($errors->all() as $pesan)
                        <li>{{ $pesan }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('siswa.masuk.aksi') }}" class="akun__form" novalidate>
            @csrf

            <div class="grup">
                <label class="label" for="nis">NIS</label>
                <input
                    class="input"
                    type="text"
                    id="nis"
                    name="nis"
                    inputmode="numeric"
                    value="{{ old('nis') }}"
                    maxlength="32"
                    required
                    autofocus
                    autocomplete="username"
                    placeholder="Nomor induk siswa"
                >
            </div>

            <div class="grup">
                <label class="label" for="password">Kata sandi</label>
                <input
                    class="input"
                    type="password"
                    id="password"
                    name="password"
                    required
                    autocomplete="current-password"
                >
            </div>

            <button type="submit" class="tombol tombol--bata tombol--penuh">Masuk</button>
        </form>

        <p class="akun__ganti">
            Belum punya akun? <a href="{{ route('siswa.daftar') }}">Daftar dulu</a>
        </p>
    </div>
@endsection
