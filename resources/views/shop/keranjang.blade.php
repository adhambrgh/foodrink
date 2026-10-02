@extends('layouts.shop')

{{-- Halaman keranjang: daftar jajan milik siswa yang sedang login.
     Konten dirender server; JS di app.js hanya mengatur tambah/kurang/hapus
     lalu memanggil endpoint sinkron untuk memperbarui isi keranjang. --}}
@section('judul', 'Keranjang — Foodrink')

@section('kelas-halaman', 'halaman-keranjang')

{{-- Inline section escaped, so " became &quot; and fetch() treated
     the URL as a relative path: /%22http://...%22 -> 404. --}}
@section('atribut-body')
data-checkout-prepare="{{ route('checkout.prepare') }}"
data-checkout-index="{{ route('checkout.index') }}"
data-keranjang-sinkron="{{ route('keranjang.sinkron') }}"
@endsection

@section('konten')
    <div class="keranjang">
        <p class="hero__label"><strong>Langkah 2 dari 3</strong> &middot; cek dulu sebelum bayar</p>
        <h1 class="admin__judul">Pesanmu.</h1>

        {{-- Daftar ini dirender di server dari keranjang milik akun, jadi
             keadaannya benar sejak halaman dibuka, tanpa bergantung pada
             cache browser. JS menulis ulang isinya setiap kali ada
             perubahan, dan balasan server yang dipakai untuk itu.

             Tamu (belum login) dapat $cart kosong dari server — JS akan
             fill dari localStorage. Flag data-belum-login dipakai supaya
             UI tidak menampilkan form/data yang butuh login. --}}
        <ul class="keranjang__list" role="list" aria-label="Isi keranjang"
            {{-- Isi keranjang ikut ditanam di sini supaya JS tahu persis
                 apa yang sudah dikonfirmasi server, bukan menebak dari
                 cache browser yang mungkin milik akun lain. --}}
            data-cart="{{ json_encode($cart) }}"
            @if (! $sudahLogin) data-belum-login="1" @endif>
            @forelse ($cart as $item)
                @php $maksimal = $item['jumlah'] >= $item['stok']; @endphp
                <li class="keranjang__item" data-id="{{ $item['id'] }}">
                    <div class="keranjang__foto" aria-hidden="true">
                        @if ($item['gambar'])
                            <img src="{{ $item['gambar'] }}" alt="" loading="lazy" class="keranjang__img">
                        @endif
                    </div>
                    <div class="keranjang__isi">
                        <div class="keranjang__nama">{{ $item['nama'] }}</div>
                        <div class="keranjang__harga">Rp {{ number_format($item['harga'], 0, ',', '.') }} <span>&times; {{ $item['jumlah'] }}</span></div>
                        <div class="keranjang__kuantitas">
                            <button type="button" class="tombol-ikon btn-kurang" aria-label="Kurangi {{ $item['nama'] }}" data-id="{{ $item['id'] }}">
                                <x-icon name="kurang" size="18" />
                            </button>
                            <span class="keranjang__jumlah">{{ $item['jumlah'] }}</span>
                            <button type="button" class="tombol-ikon btn-tambah" aria-label="Tambah {{ $item['nama'] }}" data-id="{{ $item['id'] }}" @disabled($maksimal)>
                                <x-icon name="tambah" size="18" />
                            </button>
                            @if ($maksimal)
                                <span class="keranjang__sisa">stok tinggal {{ $item['stok'] }}</span>
                            @endif
                        </div>
                    </div>
                    <div class="keranjang__kanan">
                        <div class="harga keranjang__subtotal">Rp {{ number_format($item['harga'] * $item['jumlah'], 0, ',', '.') }}</div>
                        <button type="button" class="tombol-ikon tombol-ikon--halus keranjang__hapus" aria-label="Hapus {{ $item['nama'] }}" data-id="{{ $item['id'] }}">
                            <x-icon name="hapus" size="18" />
                        </button>
                    </div>
                </li>
            @empty
                <li class="kosong kosong--kartu" data-kosong>
                    <div class="kosong__ikon" aria-hidden="true">
                        <x-icon name="keranjang" size="26" />
                    </div>
                    <h2>Keranjang masih kosong</h2>
                    <p>Yuk pilih jajan dulu di <a href="{{ route('katalog') }}">katalog</a>.</p>
                </li>
            @endforelse
        </ul>

        <form id="penerima-form" class="keranjang__form" novalidate>
            <div class="keranjang__kepala-bagian">
                <h2>Data penerima</h2>
                @if ($sudahLogin && filled($tujuan['nama'] ?? null))
                    {{-- Siswa login: field di bawah sudah terisi dari profil,
                         jadi cukup dicek, tidak perlu diketik ulang. --}}
                    <p class="keranjang__santai">Terisi otomatis dari profilmu. Cek dulu, ya.</p>
                @else
                    <p class="keranjang__santai">Semua diisi dulu ya, biar jajanmu nggak nyasar.</p>
                @endif
            </div>

            <div class="keranjang__form-grid">
                <div class="grup">
                    <label class="label" for="nama-penerima">Nama penerima</label>
                    <input
                        type="text"
                        id="nama-penerima"
                        name="nama"
                        class="input"
                        placeholder="Contoh: Asep"
                        autocomplete="name"
                        maxlength="120"
                        required
                        value="{{ old('nama', $tujuan['nama'] ?? '') }}"
                        aria-describedby="galat-nama-penerima"
                    >
                    <p class="galat-input" id="galat-nama-penerima" data-galat hidden></p>
                </div>

                <div class="grup">
                    <label class="label" for="ruang">Nama ruangan</label>
                    <input
                        type="text"
                        id="ruang"
                        name="ruang"
                        class="input"
                        placeholder="misal. Ruang 24"
                        maxlength="60"
                        required
                        value="{{ old('ruang', $tujuan['ruang'] ?? '') }}"
                        aria-describedby="galat-ruang"
                    >
                    <p class="galat-input" id="galat-ruang" data-galat hidden></p>
                </div>
            </div>

            <div class="keranjang__kelas-baris">
                <div class="grup">
                    <label class="label" for="tingkat">Kelas</label>
                    <select class="input" id="tingkat" name="tingkat" required aria-describedby="galat-tingkat">
                        <option value="">Pilih tingkat</option>
                        @foreach (\App\Enums\TingkatKelas::cases() as $tingkat)
                            <option value="{{ $tingkat->value }}" @selected(old('tingkat', $tujuan['tingkat'] ?? '') === $tingkat->value)>{{ $tingkat->label() }}</option>
                        @endforeach
                    </select>
                    <p class="galat-input" id="galat-tingkat" data-galat hidden></p>
                </div>

                <div class="grup">
                    <label class="label" for="jurusan">Jurusan</label>
                    <select class="input" id="jurusan" name="jurusan" required aria-describedby="galat-jurusan">
                        <option value="">Pilih jurusan</option>
                        @foreach (\App\Enums\Jurusan::cases() as $jurusan)
                            <option value="{{ $jurusan->value }}" @selected(old('jurusan', $tujuan['jurusan'] ?? '') === $jurusan->value)>{{ $jurusan->label() }}</option>
                        @endforeach
                    </select>
                    <p class="galat-input" id="galat-jurusan" data-galat hidden></p>
                </div>

                <div class="grup">
                    <label class="label" for="kode-kelas">Kode</label>
                    <select class="input" id="kode-kelas" name="kode_kelas" required aria-describedby="galat-kode-kelas">
                        <option value="">Pilih</option>
                        @foreach (\App\Enums\KodeKelas::cases() as $kode)
                            <option value="{{ $kode->value }}" @selected(old('kode_kelas', $tujuan['kode_kelas'] ?? '') === $kode->value)>{{ $kode->label() }}</option>
                        @endforeach
                    </select>
                    <p class="galat-input" id="galat-kode-kelas" data-galat hidden></p>
                </div>
            </div>

        </form>

        {{-- Kartu ini di-render ulang oleh JS setiap keranjang berubah, tapi hanya
             bagian total dan tombolnya. Pilihan cara bayar sengaja diluar
             dari area itu: kalau ikut di-overwrite, radionya hilang begitu
             JS jalan. --}}
        <div class="keranjang__ringkasan{{ empty($cart) ? ' keranjang__ringkasan--kosong' : '' }}" aria-live="polite">
            <div id="keranjang-total"
                data-total="{{ collect($cart)->sum(fn ($item) => $item['harga'] * $item['jumlah']) }}"
                data-jumlah="{{ collect($cart)->sum('jumlah') }}"></div>

            <fieldset class="bayar-pilihan">
                <legend class="bayar-pilihan__judul">Bayar pakai</legend>

                <label class="bayar-pilihan__opsi" for="bayar-non-tunai">
                    <input type="radio" name="cara_bayar" id="bayar-non-tunai" value="qris" checked>
                    <span class="bayar-pilihan__teks">
                        <strong>Non tunai</strong>
                        <small>QRIS, VA, atau e-Wallet lewat Midtrans</small>
                    </span>
                </label>

                <label class="bayar-pilihan__opsi" for="bayar-tunai">
                    <input type="radio" name="cara_bayar" id="bayar-tunai" value="tunai">
                    <span class="bayar-pilihan__teks">
                        <strong>Tunai</strong>
                        <small>Bayar saat jajan diantar ke ruangan</small>
                    </span>
                </label>
            </fieldset>

            <button type="button" class="tombol tombol--bata tombol--penuh" id="checkout-btn" style="margin-top: var(--s3)">Bayar &amp; pesan</button>
        </div>
    </div>
@endsection
