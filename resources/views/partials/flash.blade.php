@php
    /*
     * Satu partial untuk tiga jenis pesan. Warna ditentukan lewat
     * array $warna agar view tidak perlu switch warna sendiri.
     *
     * role="alert" supaya screen reader langsung membacanya saat muncul,
     * bukan menunggu pengguna menemukan sendiri.
     */
    // Petakan jenis flash ke kelas css dan ikon
    $peta = [
        'sukses' => ['kelas' => 'flash--sukses', 'ikon' => 'cek'],
        'peringatan' => ['kelas' => 'flash--peringatan', 'ikon' => 'silang'],
        'galat' => ['kelas' => 'flash--galat', 'ikon' => 'silang'],
    ];

    // Tampung pesan yang siap dirender
    $pesan = [];

    foreach (['sukses', 'peringatan', 'galat'] as $jenis) {
        foreach ((array) session($jenis) as $isi) {
            $pesan[] = ['teks' => $isi, ...$peta[$jenis]];
        }
    }
@endphp

@foreach ($pesan as $baris)
    <div class="flash {{ $baris['kelas'] }}" role="alert" data-flash>
        <x-icon :name="$baris['ikon']" size="18" class="flash__ikon" />
        <span>{{ $baris['teks'] }}</span>
    </div>
@endforeach
