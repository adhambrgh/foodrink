@extends('layouts.shop')

{{-- Profil siswa: ubah nama + kelas/ruang tujuan antar, riwayat pesanan
     terakhir, dan tombol keluar. Kelas yang diubah di sini otomatis
     dipakai lagi saat checkout, karena sumber datanya sama. --}}
@section('judul', 'Profil — Foodrink')
@section('kelas-halaman', 'halaman-profil')

@section('konten')
<div class="profil">
    <div class="profil__kepala">
        <div class="profil__avatar" aria-hidden="true">
            {{ mb_strtoupper(mb_substr($siswa->nama, 0, 1)) }}
        </div>
        <div class="profil__identitas">
            <p class="hero__label"><strong>Akun</strong> &middot; profil siswa</p>
            <h1 class="admin__judul">{{ $siswa->nama }}</h1>
            <p class="admin__sub profil__meta">
                <span class="profil__chip"><x-icon name="daftar" size="14" /> {{ $siswa->nis }}</span>
                <span class="profil__chip"><x-icon name="lokasi" size="14" /> {{ collect([$siswa->tingkat?->value, $siswa->jurusan?->value, $siswa->kode_kelas?->value])->filter()->implode(' ') ?: 'kelas belum diatur' }}{{ $siswa->ruang ? ' · '.$siswa->ruang : '' }}</span>
            </p>
        </div>
    </div>

    <div class="profil__grid">
        <section class="admin__kartu" aria-labelledby="profil-edit">
            <h2 id="profil-edit" class="checkout__judul">Ubah profil</h2>
            <p class="admin__sub">Alamat antar ini yang dipakai form pembayaran.</p>
            <form method="POST" action="{{ route('siswa.profil.update') }}">
                @csrf @method('PUT')
                <div class="grup">
                    <label class="label" for="nama">Nama</label>
                    <input class="input" id="nama" name="nama" value="{{ old('nama', $siswa->nama) }}" required>
                </div>
                <div class="akun__baris-tiga">
                    <div class="grup">
                        <label class="label" for="tingkat">Tingkat</label>
                        <select class="input" id="tingkat" name="tingkat" required>
                            @foreach ($tingkat as $o) <option value="{{ $o->value }}" @selected(old('tingkat', $siswa->tingkat?->value) === $o->value)>{{ $o->label() }}</option> @endforeach
                        </select>
                    </div>
                    <div class="grup">
                        <label class="label" for="jurusan">Jurusan</label>
                        <select class="input" id="jurusan" name="jurusan" required>
                            @foreach ($jurusan as $o) <option value="{{ $o->value }}" @selected(old('jurusan', $siswa->jurusan?->value) === $o->value)>{{ $o->label() }}</option> @endforeach
                        </select>
                    </div>
                    <div class="grup">
                        <label class="label" for="kode_kelas">Kode</label>
                        <select class="input" id="kode_kelas" name="kode_kelas" required>
                            @foreach ($kodeKelas as $o) <option value="{{ $o->value }}" @selected(old('kode_kelas', $siswa->kode_kelas?->value) === $o->value)>{{ $o->label() }}</option> @endforeach
                        </select>
                    </div>
                </div>
                <div class="grup">
                    <label class="label" for="ruang">Ruang</label>
                    <input class="input" id="ruang" name="ruang" value="{{ old('ruang', $siswa->ruang) }}" required>
                </div>
                <button type="submit" class="tombol tombol--bata tombol--penuh" style="margin-top: var(--s4)">Simpan</button>
            </form>
        </section>

        <section class="admin__kartu profil__riwayat" aria-labelledby="profil-riwayat">
            <div class="profil__riwayat-kepala">
                <h2 id="profil-riwayat" class="checkout__judul">Riwayat terakhir</h2>
                @if ($pesanan->isNotEmpty())
                    <a href="{{ route('pesanan.index') }}" class="profil__semua">Lihat semua <x-icon name="chevron" size="14" /></a>
                @endif
            </div>

            @forelse ($pesanan as $o)
                <a href="{{ route('pesanan.show', $o->kode) }}" class="profil__riwayat-item">
                    <span class="profil__riwayat-info">
                        <strong class="profil__riwayat-kode">{{ $o->kode }}</strong>
                        <span class="profil__riwayat-meta">{{ $o->created_at?->format('d M Y') }} · {{ $o->jumlah_item }} jajan · <span class="harga">{{ $o->total_rupiah }}</span></span>
                    </span>
                    <span class="badge badge--{{ $o->status->warnaCss() }}">{{ $o->status->label() }}</span>
                </a>
            @empty
                <div class="kosong">
                    <div class="kosong__ikon" aria-hidden="true"><x-icon name="keranjang" size="26" /></div>
                    <h2>Belum ada pesanan</h2>
                    <p>Jajan pertama kamu akan muncul di sini.</p>
                    <a href="{{ route('katalog') }}#produk" class="tombol tombol--bata tombol--kecil">Lihat katalog</a>
                </div>
            @endforelse

            <form method="POST" action="{{ route('siswa.keluar') }}" class="profil__keluar">
                @csrf
                <button type="submit" class="tombol tombol--halus"><x-icon name="keluar" size="16" /> Keluar dari akun</button>
            </form>
        </section>
    </div>
</div>
@endsection
