@extends('layouts.shop')

{{-- Struk/bukti detail satu pesanan. Hanya bisa dibuka oleh siswa pemilik
     order tersebut (dicek lewat relasi di PesananController::show). --}}
@section('judul', 'Struk pesanan')

@section('kelas-halaman', 'halaman-struk')

@section('konten')
    {{-- Struk dibuat seperti kertas kasir: sempit, satu kolom, dan bagian
         yang tidak perlu ikut tercetak disembunyikan saat print. Kode
         pesanan ditonjolkan karena itu satu-satunya hal yang benar-benar
         dibaca petugas. --}}
    <article class="struk">
        <header class="struk__kepala">
            <p class="struk__merek">Foodrink</p>
            <p class="struk__alamat">Jajanan sekolah &middot; antar ke kelas</p>
        </header>

        <div class="struk__status">
            <span class="badge badge--{{ $order->status->warnaCss() }}">{{ $order->status->label() }}</span>
        </div>

        <h1 class="struk__judul">{{ $kepala }}</h1>
        <p class="struk__catatan">{{ $catatan }}</p>

        <div class="struk__kode-box">
            <span class="struk__kode-label">Kode pesanan</span>
            <span class="struk__kode">{{ $order->kode }}</span>
        </div>

        <dl class="struk__meta">
            <div class="struk__baris">
                <dt>Penerima</dt>
                <dd>{{ $order->nama }}</dd>
            </div>
            <div class="struk__baris">
                <dt>Kelas</dt>
                <dd>{{ $order->kelas_lengkap ?: '-' }}</dd>
            </div>
            <div class="struk__baris">
                <dt>Ruangan</dt>
                <dd>{{ $order->ruang ?: '-' }}</dd>
            </div>
            <div class="struk__baris">
                <dt>Bayar</dt>
                <dd>{{ $order->caraBayarLabel() }}</dd>
            </div>
            <div class="struk__baris">
                <dt>Dipesan</dt>
                <dd>{{ $order->created_at?->format('d M Y, H:i') }}</dd>
            </div>
        </dl>

        <ul class="struk__items" role="list">
            @foreach ($order->items as $item)
                <li class="struk__item">
                    <span class="struk__item-nama">{{ $item->nama }}</span>
                    <span class="struk__item-jumlah">{{ $item->jumlah }} &times;</span>
                    <span class="struk__item-harga">{{ $item->subtotal_rupiah }}</span>
                </li>
            @endforeach
        </ul>

        <div class="struk__total">
            <div class="struk__total-baris">
                <span>Subtotal</span>
                <span class="tabel-angka">{{ $order->total_rupiah }}</span>
            </div>
            <div class="struk__total-baris struk__total-ongkir">
                <span>Ongkir antar ke kelas</span>
                <span>Gratis</span>
            </div>
            <div class="struk__total-akhir">
                <span>Total</span>
                <span class="tabel-angka">{{ $order->total_rupiah }}</span>
            </div>
        </div>

        <footer class="struk__kaki">
            <p>Terima kasih sudah jajan di Foodrink!</p>
        </footer>

        <div class="struk__aksi">
            <button type="button" class="tombol tombol--outline tombol--penuh" data-cetak-struk>
                <x-icon name="cetak" size="18" />
                Cetak struk
            </button>
            <a href="{{ route('pesanan.index') }}" class="tombol tombol--bata tombol--penuh">Lihat riwayat pesanan</a>
            <a href="{{ route('katalog') }}" class="struk__link-lagi">Jajan yuk</a>
        </div>
    </article>
@endsection

@push('bawah')
<script>
    // Struk ini bisa muncul lebih dari sekali di satu halaman (dipakai juga
    // di daftar riwayat), jadi tombolnya dilepas per elemen, bukan globale.
    document.querySelectorAll('[data-cetak-struk]').forEach((tombol) => {
        tombol.addEventListener('click', () => window.print());
    });
</script>
@endpush
