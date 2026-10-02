@extends('layouts.shop')

{{-- Halaman bayar pesanan: ringkasan belanja, data penerima,
     dan tombol popup Snap Midtrans (atau konfirmasi bila bayar tunai). --}}
@section('judul', 'Bayar')

@section('kelas-halaman', 'halaman-checkout')

@section('konten')
    <div class="checkout">
        <h1>Bayar dulu ya</h1>

        <div class="checkout__grid">
            <section class="checkout__kartu" aria-labelledby="cek-ringkasan">
                <h2 class="checkout__judul" id="cek-ringkasan">Ringkasan Pesanan</h2>

                <ul class="checkout__items" role="list">
                    @foreach ($cart as $item)
                        <li class="checkout__item">
                            <div class="checkout__item-info">
                                <div class="checkout__item-nama">{{ $item['nama'] }}</div>
                                <div class="checkout__item-qty">{{ $item['jumlah'] }} &times; Rp {{ number_format($item['harga'], 0, ',', '.') }}</div>
                            </div>
                            <div class="checkout__item-total">Rp {{ number_format($item['harga'] * $item['jumlah'], 0, ',', '.') }}</div>
                        </li>
                    @endforeach
                </ul>

                <div class="checkout__total">
                    <div class="checkout__baris">
                        <span>Total</span>
                        <span class="harga">Rp {{ number_format($total, 0, ',', '.') }}</span>
                    </div>
                </div>
            </section>

            <section class="checkout__kartu checkout__bayar" aria-labelledby="cek-bayar">
                <h2 class="checkout__judul" id="cek-bayar">Pembayaran</h2>

                {{-- Data penerima pakai dt/dd, bukan baris <p> bebas: tanpa
                     label, "A · X RPL A" lalu "A" cuma jadi tebakan. --}}
                <dl class="checkout__tujuan">
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
                    <div>
                        <dt>Kode pesanan</dt>
                        <dd class="checkout__kode">{{ $order->kode }}</dd>
                    </div>
                </dl>

                {{-- Popup Midtrans opened from here, not on page load: a popup
                     that appears by itself before the buyer has read the
                     total tends to get closed by reflex. --}}
                @if ($order->bayarTunai())
                    <div class="checkout__tunai">
                        <strong>Pesanan sudah masuk.</strong>
                        <p>
                            Bayar Rp {{ number_format($total, 0, ',', '.') }} ke
                            {{ $order->ruang ?: 'ruanganmu' }} pas jajan diantar.
                        </p>
                        <a href="{{ route('pesanan.show', $order->kode) }}" class="tombol tombol--outline">Lihat pesanan</a>
                    </div>
                @else
                    <div class="checkout__aksi">
                        <button
                            type="button"
                            class="tombol tombol--bata tombol--penuh"
                            id="buka-pembayaran"
                            @disabled(! $snapToken)
                        >
                            Bayar Rp {{ number_format($total, 0, ',', '.') }}
                        </button>
                    </div>
                @endif

                <div id="snap-error" class="checkout__snap-gagal" role="alert" hidden>
                    <strong>Gagal memuat pembayaran.</strong>
                    <p>Tidak bisa connect ke Midtrans. Cek koneksi, lalu coba lagi.</p>
                    <a href="{{ route('keranjang') }}" class="tombol tombol--outline">Kembali ke keranjang</a>
                </div>

                <div id="snap-batal" class="checkout__snap-gagal checkout__snap-gagal--lunak" role="alert" hidden>
                    <strong>Pembayaran belum selesai.</strong>
                    <p>Tekan tombol bayar kalau mau lanjut.</p>
                </div>
            </section>
        </div>
    </div>
@endsection

@push('bawah')
@if (! $order->bayarTunai())
{{-- snap.js dipanggil dengan domain yang cocok dengan server key: sandbox
     dan production punya script terpisah, jadi URL-nya ikut dari config. --}}
<script src="{{ $snapUrl }}" data-client-key="{{ $clientKey }}"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const snapToken = @json($snapToken);
        const tombol = document.getElementById('buka-pembayaran');
        const galat = document.getElementById('snap-error');
        const batal = document.getElementById('snap-batal');

        // Snap memanggil onClose juga setelah onSuccess/onPending, jadi
        // penanda ini yang mencegah halaman checkout ikut "ditutup" padahal
        // pembayarannya sedang berjalan.
        let sudahSelesai = false;

        const buka = () => {
            if (typeof window.snap === 'undefined') {
                galat.hidden = false;
                return;
            }

            // Batal bukan berarti pesanan dibuang: popup ditutup, pembeli
            // tetap di halaman ini supaya bisa buka lagi sebelum batas
            // 30 menitnya habis.
            sudahSelesai = false;
            batal.hidden = true;

            window.snap.pay(snapToken, {
                onSuccess: (result) => {
                    sudahSelesai = true;
                    window.location.href = @json($finishUrl) + '?order_id=' + encodeURIComponent(result.order_id) + '&status=success';
                },
                onPending: (result) => {
                    sudahSelesai = true;
                    window.location.href = @json($finishUrl) + '?order_id=' + encodeURIComponent(result.order_id) + '&status=pending';
                },
                onError: (result) => {
                    sudahSelesai = true;
                    window.location.href = @json($errorUrl) + '?order_id=' + encodeURIComponent(result.order_id ?? '');
                },
                onClose: () => {
                    if (sudahSelesai) return;
                    batal.hidden = false;
                },
            }).catch(() => {
                galat.hidden = false;
            });
        };

        tombol?.addEventListener('click', buka);
    });
</script>
@endif
@endpush
