{{-- Pakai kerangka toko --}}
@extends('layouts.shop')

{{-- Form pendaftaran siswa baru (guard `siswa`). NIS wajib unik.
     Kelas & ruang wajib diisi karena dipakai sebagai alamat antar
     otomatis saat checkout, jadi pembeli tidak perlu mengetik ulang. --}}
@section('judul', 'Daftar')

@section('konten')
    <div class="akun">
        <p class="hero__label"><strong>Siswa</strong> &middot; sekali daftar</p>
        <h1 class="akun__judul">Buat akun</h1>
        <p class="akun__santai">
            Pake NIS sekolah. Kelas &amp; ruangannya diisi sekarang ya, biar
            nanti tinggal klik bayar.
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

        <form method="POST" action="{{ route('siswa.daftar.aksi') }}" class="akun__form" novalidate>
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
                <label class="label" for="nama">Nama</label>
                <input
                    class="input"
                    type="text"
                    id="nama"
                    name="nama"
                    value="{{ old('nama') }}"
                    maxlength="120"
                    required
                    autocomplete="name"
                    placeholder="Nama lengkap"
                >
            </div>

            <div class="akun__baris-dua">
                <div class="grup">
                    <label class="label" for="password">Kata sandi</label>
                    <input
                        class="input"
                        type="password"
                        id="password"
                        name="password"
                        required
                        minlength="6"
                        autocomplete="new-password"
                    >
                </div>

                <div class="grup">
                    <label class="label" for="password_confirmation">Ulangi kata sandi</label>
                    <input
                        class="input"
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        required
                        minlength="6"
                        autocomplete="new-password"
                    >
                </div>
            </div>

            {{-- Kelompokan field kelas untuk tujuan pengantaran --}}
            <fieldset class="akun__kelompok">
                <legend class="label">Kelas <span class="akun__opsional">(wajib diisi, dipakai untuk antar jajan)</span></legend>

                <div class="akun__baris-tiga">
                    <div class="grup">
                        <label class="label" for="tingkat">Tingkat</label>
                        <select class="input" id="tingkat" name="tingkat" required aria-describedby="galat-tingkat">
                            <option value="">Pilih tingkat</option>
                            @foreach ($tingkat as $pilihan)
                                <option value="{{ $pilihan->value }}" @selected(old('tingkat') === $pilihan->value)>
                                    {{ $pilihan->label() }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="grup">
                        <label class="label" for="jurusan">Jurusan</label>
                        <select class="input" id="jurusan" name="jurusan" required aria-describedby="galat-jurusan">
                            <option value="">Pilih jurusan</option>
                            @foreach ($jurusan as $pilihan)
                                <option value="{{ $pilihan->value }}" @selected(old('jurusan') === $pilihan->value)>
                                    {{ $pilihan->label() }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="grup">
                        <label class="label" for="kode_kelas">Kode</label>
                        <select class="input" id="kode_kelas" name="kode_kelas" required aria-describedby="galat-kode">
                            <option value="">Pilih</option>
                            @foreach ($kodeKelas as $pilihan)
                                <option value="{{ $pilihan->value }}" @selected(old('kode_kelas') === $pilihan->value)>
                                    {{ $pilihan->label() }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <div class="grup">
                    <label class="label" for="ruang">Nama ruangan</label>
                    <input
                        class="input"
                        type="text"
                        id="ruang"
                        name="ruang"
                        value="{{ old('ruang') }}"
                        maxlength="60"
                        required
                        placeholder="misal. Ruang 24"
                    >
                </div>
            </fieldset>

            <button type="submit" class="tombol tombol--bata tombol--penuh">Daftar</button>
        </form>

        <p class="akun__ganti">
            Sudah punya akun? <a href="{{ route('siswa.masuk') }}">Masuk aja</a>
        </p>
    </div>
@endsection
