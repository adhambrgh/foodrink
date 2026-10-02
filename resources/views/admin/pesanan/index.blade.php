@extends('layouts.admin')

{{-- Antrean kerja petugas: pesanan lunas yang perlu diantar. Admin bisa
     ubah status ke Selesai/Batal sesuai transisi yang diizinkan enum. --}}
@section('judul', 'Pesanan')

@section('konten')
    <div class="admin__kepala">
        <div>
            <p class="hero__label"><strong>Admin</strong> &middot; pesanan</p>
            <h1 class="admin__judul">Pesanan masuk</h1>
        </div>
    </div>
    <p class="admin__sub">
        Daftar ini sudah otomatis masuk setelah pembayaran Midtrans berhasil.
        Tekan <strong>Selesai</strong> waktu jajannya sudah diambil.
    </p>

    <nav class="pesanan-filter" aria-label="Saring pesanan">
        <a
            href="{{ route('admin.pesanan.index', array_filter(['q' => $q])) }}"
            class="pesanan-filter__chip {{ $statusAktif === null ? 'pesanan-filter__chip--aktif' : '' }}"
            @if ($statusAktif === null) aria-current="page" @endif
        >
            Semua <span>{{ $jumlah->sum() }}</span>
        </a>
        @foreach (\App\Enums\StatusOrder::untukAdmin() as $s)
            <a
                href="{{ route('admin.pesanan.index', array_filter(['status' => $s->name, 'q' => $q])) }}"
                class="pesanan-filter__chip {{ $statusAktif === $s ? 'pesanan-filter__chip--aktif' : '' }}"
                @if ($statusAktif === $s) aria-current="page" @endif
            >
                {{ $s->label() }} <span>{{ $jumlah->get($s->value, 0) }}</span>
            </a>
        @endforeach
    </nav>

    <form method="GET" action="{{ route('admin.pesanan.index') }}" class="pesanan-cari">
        @if ($statusAktif)
            <input type="hidden" name="status" value="{{ $statusAktif->name }}">
        @endif
        <label class="hanya-layar-baca" for="q-pesanan">Cari pesanan</label>
        <input
            class="input"
            type="search"
            id="q-pesanan"
            name="q"
            value="{{ $q }}"
            placeholder="Kode, nama, atau ruangan"
        >
        <button type="submit" class="tombol tombol--bata">Cari</button>
        @if ($q !== '' || $statusAktif)
            <a href="{{ route('admin.pesanan.index') }}" class="tombol tombol--outline">Reset</a>
        @endif
    </form>

    <div class="admin__kartu">
        @forelse ($pesanan as $order)
            <article class="pesanan-admin">
                <div class="pesanan-admin__kepala">
                    <div>
                        <a href="{{ route('pesanan.show', $order->kode) }}" class="pesanan-admin__kode" target="_blank" rel="noopener">{{ $order->kode }}</a>
                        <p class="pesanan-admin__waktu">{{ $order->created_at?->format('d M Y, H:i') }}</p>
                    </div>
                        <span class="badge badge--{{ $order->status->warnaCss() }}">{{ $order->status->label() }}</span>
                    </div>

                    {{-- Tunai berarti petugas yang nagih di tempat, jadi ini
                         bukan informasi tambahan: ini yang harus dikerjakan. --}}
                    @if ($order->bayarTunai())
                        <p class="pesanan-admin__tunai">Tunai — terima Rp {{ number_format($order->total, 0, ',', '.') }} saat antar</p>
                    @endif

                <dl class="pesanan-admin__tujuan">
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
                        <dt>Total</dt>
                        <dd class="harga">{{ $order->total_rupiah }}</dd>
                    </div>
                </dl>

                <ul class="pesanan-admin__items" role="list">
                    @foreach ($order->items as $item)
                        <li><span>{{ $item->nama }}</span> <span>&times; {{ $item->jumlah }}</span></li>
                    @endforeach
                </ul>

                {{-- Tombol status dibatasi oleh enum: kalau perpindahan tidak
                     dibolehkan, tombolnya tidak dirender sama sekali. --}}
                @php $tujuan = collect(\App\Enums\StatusOrder::cases())->filter(fn ($s) => $order->bolehUbahKe($s)); @endphp
                @if ($tujuan->isNotEmpty())
                    <div class="pesanan-admin__aksi">
                        @foreach ($tujuan as $s)
                            <form method="POST" action="{{ route('admin.pesanan.status', $order) }}">
                                @csrf
                                @method('PATCH')
                                <input type="hidden" name="status" value="{{ $s->value }}">
                                <button type="submit" class="tombol tombol--kecil {{ $s === \App\Enums\StatusOrder::Selesai ? 'tombol--bata' : 'tombol--outline' }}">
                                    {{ $s->label() }}
                                </button>
                            </form>
                        @endforeach
                    </div>
                @endif
            </article>
        @empty
            <div class="kosong kosong--kartu">
                <div class="kosong__ikon" aria-hidden="true">
                    <x-icon name="keranjang" size="26" />
                </div>
                <h2>Belum ada pesanan</h2>
                <p>Belum ada pesanan yang cocok dengan saringan ini.</p>
            </div>
        @endforelse
    </div>

    @if ($pesanan->hasMorePages())
        <nav class="pesanan-cari" aria-label="Halaman pesanan">
            @if ($pesanan->onFirstPage())
                <span class="tombol tombol--kecil" aria-disabled="true">Sebelumnya</span>
            @else
                <a class="tombol tombol--kecil" href="{{ $pesanan->previousPageUrl() }}" rel="prev">Sebelumnya</a>
            @endif

            <a class="tombol tombol--kecil" href="{{ $pesanan->nextPageUrl() }}" rel="next">Berikutnya</a>
        </nav>
    @endif
@endsection
