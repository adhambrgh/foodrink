@extends('layouts.shop')

@section('judul', 'Status Pembayaran')

@section('kelas-halaman', 'halaman-checkout-finish')

@section('konten')
    <div class="checkout-finish" style="text-align: center; padding: var(--s8) var(--s4); max-width: 400px; margin: 0 auto;">
        @if ($orderId)
            <div class="ikon-besar" style="width: 80px; height: 80px; margin: 0 auto var(--s4); border-radius: 50%; background: var(--hijau-100); display: flex; align-items: center; justify-content: center;">
                <svg class="ikon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--hijau-600)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
        @else
            <div class="ikon-besar" style="width: 80px; height: 80px; margin: 0 auto var(--s4); border-radius: 50%; background: var(--warna-100); display: flex; align-items: center; justify-content: center;">
                <svg class="ikon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--warna-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
        @endif

        <h1 style="margin-bottom: var(--s2);">{{ $message }}</h1>

        @if ($orderId)
            <p style="color: var(--warna-500); margin-bottom: var(--s4);">Nomor pesanan: <strong>{{ $orderId }}</strong></p>
        @endif

        <div style="display: flex; flex-direction: column; gap: var(--s2);">
            <a href="{{ route('katalog') }}" class="tombol tombol--bata tombol--penuh">Kembali ke Katalog</a>
            <a href="{{ route('pesanan.index') }}" class="tombol tombol--outline tombol--penuh">Lihat riwayat pesanan</a>
        </div>
    </div>
@endsection