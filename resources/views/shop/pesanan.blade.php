@extends('layouts.shop')

{{-- Riwayat pesanan pembeli. Daftar diambil dari akun siswa (bukan session),
     jadi tetap ada walau ganti perangkat. --}}
@section('judul', 'Pesanan saya')

@section('kelas-halaman', 'halaman-pesanan')

@section('konten')
    <div class="pesanan-saya">
        <header class="pesanan-saya__kepala">
            <p class="hero__label">Riwayat</p>
            <h1 class="admin__judul">Pesanan kamu</h1>
            <p class="admin__sub">
                Ini daftar pesanan dari browser ini. Kalau kamu ganti HP atau clears
                cache, riwayatnya ikut hilang.
            </p>
        </header>

        @forelse ($pesanan as $order)
            <article class="pesanan-kartu">
                <div class="pesanan-kartu__kepala">
                    <div>
                        <a href="{{ route('pesanan.show', $order->kode) }}" class="pesanan-kartu__kode">{{ $order->kode }}</a>
                        <p class="pesanan-kartu__waktu">
                            <x-icon name="jam" size="14" />
                            {{ $order->created_at?->format('d M Y, H:i') }}
                        </p>
                    </div>
                    <span class="badge badge--{{ $order->status->warnaCss() }}">{{ $order->status->label() }}</span>
                </div>

                <dl class="pesanan-kartu__tujuan">
                    <div>
                        <dt>Penerima</dt>
                        <dd>{{ $order->nama }}</dd>
                    </div>
                    <div>
                        <dt>Kelas</dt>
                        <dd>{{ $order->kelas_lengkap ?: '-' }}</dd>
                    </div>
                    <div>
                        <dt>Ruangan</dt>
                        <dd>{{ $order->ruang ?: '-' }}</dd>
                    </div>
                </dl>

                <ul class="pesanan-kartu__items" role="list">
                    @foreach ($order->items as $item)
                        <li>{{ $item->nama }} &times; {{ $item->jumlah }}</li>
                    @endforeach
                </ul>

                <div class="pesanan-kartu__kaki">
                    <span class="harga pesanan-kartu__total">{{ $order->total_rupiah }}</span>
                    <a href="{{ route('pesanan.show', $order->kode) }}" class="tombol tombol--kecil tombol--outline">Lihat struk</a>
                </div>
            </article>
        @empty
            <div class="kosong kosong--kartu">
                <div class="kosong__ikon" aria-hidden="true">
                    <x-icon name="keranjang" size="26" />
                </div>
                <h2>Belum ada pesanan</h2>
                <p>Yuk pilih jajan dulu di <a href="{{ route('katalog') }}">katalog</a>.</p>
            </div>
        @endforelse
    </div>
@endsection
