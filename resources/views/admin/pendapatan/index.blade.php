{{-- Pakai kerangka admin --}}
@extends('layouts.admin')

{{-- Rekap omzet bulanan + grafik tren 12 bulan terakhir. Semua angka
     hanya menghitung pesanan berstatus terbayar (scope Order::terbayar). --}}
@section('judul', 'Pendapatan')

@section('konten')
    <div class="admin__kepala">
        <div>
            <p class="hero__label"><strong>Admin</strong> &middot; pendapatan bulanan</p>
            <h1 class="admin__judul">{{ $labelBulan }}</h1>
        </div>
        <form method="GET" action="{{ route('admin.pendapatan') }}" class="pendapatan__pilih">
            <label class="pendapatan__pilih-label" for="bulan">Bulan</label>
            <select class="input" id="bulan" name="bulan" onchange="this.form.submit()">
                @foreach ($daftarBulan as $nilai => $label)
                    <option value="{{ $nilai }}" @selected($nilai === $bulan->format('Y-m'))>{{ $label }}</option>
                @endforeach
            </select>
            <noscript><button type="submit" class="tombol tombol--kecil">Lihat</button></noscript>
        </form>
    </div>

    {{-- Kartu ringkasan angka pendapatan --}}
    <div class="pendapatan__kartu-grid">
        <div class="admin__kartu pendapatan__kartu--sorot">
            <p class="pendapatan__label">Pendapatan {{ $labelBulan }}</p>
            <p class="pendapatan__angka">{{ 'Rp '.number_format($totalBulan, 0, ',', '.') }}</p>
            <p class="admin__sub">{{ $transaksiBulan }} pesanan lunas &middot; {{ $itemBulan }} item terjual</p>
        </div>
        <div class="admin__kartu">
            <p class="pendapatan__label">Rata-rata per hari</p>
            <p class="pendapatan__angka">{{ 'Rp '.number_format($rataPerHari, 0, ',', '.') }}</p>
            <p class="admin__sub">Dihitung sampai {{ $bulan->isSameMonth(now()) ? 'hari ini' : 'akhir bulan' }}.</p>
        </div>
        <div class="admin__kartu">
            <p class="pendapatan__label">Total tahun {{ $bulan->format('Y') }}</p>
            <p class="pendapatan__angka">{{ 'Rp '.number_format($totalTahun, 0, ',', '.') }}</p>
            <p class="admin__sub">Rata-rata {{ 'Rp '.number_format($rataBulanIni, 0, ',', '.') }} per bulan.</p>
        </div>
        <div class="admin__kartu">
            <p class="pendapatan__label">Pendapatan hari ini</p>
            <p class="pendapatan__angka">{{ 'Rp '.number_format($pendapatanHariIni, 0, ',', '.') }}</p>
            <p class="admin__sub">
                @if ($bulanTerbaik)
                    Bulan terbaik: {{ $bulanTerbaik->label }} ({{ 'Rp '.number_format($bulanTerbaik->total, 0, ',', '.') }}).
                @else
                    Belum ada riwayat bulanan.
                @endif
            </p>
        </div>
    </div>

    {{-- Grafik batang tren 12 bulan --}}
    <section class="admin__kartu pendapatan__grafik" aria-labelledby="judul-grafik">
        <div class="pendapatan__kepala-kartu">
            <h2 class="pendapatan__judul" id="judul-grafik">12 bulan terakhir</h2>
            <p class="admin__sub">Hanya pesanan yang uangnya sudah masuk.</p>
        </div>
        <ul class="pendapatan__batang" role="list">
            @foreach ($grafik as $bar)
                <li
                    class="pendapatan__batang-item {{ $bar['labelLengkap'] === $labelBulan ? 'pendapatan__batang-item--aktif' : '' }}"
                    title="{{ $bar['labelLengkap'] }}: {{ 'Rp '.number_format($bar['total'], 0, ',', '.') }} dari {{ $bar['transaksi'] }} pesanan"
                >
                    <span class="pendapatan__batang-nilai">{{ $bar['total'] > 0 ? number_format($bar['total'] / 1000, 0, ',', '.') : '0' }}</span>
                    <span class="pendapatan__batang-tiang" style="--tinggi: {{ max(4, $bar['persen']) }}%"></span>
                    <span class="pendapatan__batang-label">{{ $bar['label'] }}</span>
                </li>
            @endforeach
        </ul>
        <p class="admin__sub pendapatan__satuan">Tinggi batang = jumlah uang, angka di atasnya dalam ribuan rupiah.</p>
    </section>

    {{-- Dua kolom terlaris dan rincian --}}
    <div class="pendapatan__dua-kolom">
        <section class="admin__kartu" aria-labelledby="judul-terlaris">
            <div class="pendapatan__kepala-kartu">
                <h2 class="pendapatan__judul" id="judul-terlaris">Paling laku bulan ini</h2>
                <p class="admin__sub">Berdasarkan item yang terjual.</p>
            </div>
            @forelse ($produkTerlaris as $produk)
                <div class="pendapatan__baris">
                    <div>
                        <p class="pendapatan__baris-nama">{{ $produk->nama }}</p>
                        <p class="admin__sub">{{ $produk->terjual }} item</p>
                    </div>
                    <p class="harga">{{ 'Rp '.number_format($produk->omzet, 0, ',', '.') }}</p>
                </div>
            @empty
                <p class="kosong">Belum ada penjualan di bulan ini.</p>
            @endforelse
        </section>

        <section class="admin__kartu" aria-labelledby="judul-pesanan">
            <div class="pendapatan__kepala-kartu">
                <h2 class="pendapatan__judul" id="judul-pesanan">Rincian pesanan</h2>
                <p class="admin__sub">{{ $transaksiBulan }} pesanan</p>
            </div>
            @forelse ($pesanan as $pesanan_item)
                <details class="pendapatan__rincian">
                    <summary class="pendapatan__rincian-tutup">
                        <span class="pendapatan__rincian-kiri">
                            <span class="pendapatan__rincian-nama">{{ $pesanan_item->nama }}</span>
                            <span class="admin__sub">
                                {{ $pesanan_item->kode }} &middot; {{ $pesanan_item->created_at->format('d M, H:i') }}
                                &middot; {{ $pesanan_item->tujuan_label }}
                            </span>
                        </span>
                        <span class="pendapatan__rincian-kanan">
                            <span class="badge badge--{{ $pesanan_item->status->warnaCss() }}">{{ $pesanan_item->status->label() }}</span>
                            <span class="harga">{{ $pesanan_item->total_rupiah }}</span>
                        </span>
                    </summary>
                    <ul class="pendapatan__rincian-item" role="list">
                        @foreach ($pesanan_item->items as $item)
                            <li>
                                <span>{{ $item->nama }} &times; {{ $item->jumlah }}</span>
                                <span class="harga">{{ 'Rp '.number_format($item->subtotal, 0, ',', '.') }}</span>
                            </li>
                        @endforeach
                    </ul>
                </details>
            @empty
                <p class="kosong">Belum ada pesanan lunas di {{ $labelBulan }}.</p>
            @endforelse
        </section>
    </div>
@endsection
