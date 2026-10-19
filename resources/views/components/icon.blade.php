{{-- Komponen ikon SVG tunggal untuk seluruh aplikasi.
     Dipakai lewat <x-icon name="..." size="20" />.
     Cara menambah ikon baru: tambahkan satu baris ke array $ikon --
     jangan menulis <svg> inline di view, supaya gaya dan warna
     (stroke 1.75, currentColor, tanpa isian) konsisten di semua tempat. --}}
@props(['name', 'size' => 20, 'class' => ''])

@php
    // Daftar path svg per nama ikon
    $ikon = [
        'keranjang' => '<path d="M4 8h16l-1.4 10.6A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.4L4 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 12.5v4M14.5 12.5v4"/>',

        'tambah' => '<path d="M12 5.5v13M5.5 12h13"/>',

        'kurang' => '<path d="M5.5 12h13"/>',

        'menu' => '<path d="M4 7h16M4 12h16M4 17h16"/>',

        'stok' => '<path d="M4 8.5 12 4.5l8 4v7L12 19.5 4 15.5Z"/><path d="M4 8.5 12 12.5l8-4M12 12.5v7"/>',

        'cek' => '<path d="M5 12.5 9.5 17 19 7.5"/>',

        'silang' => '<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/>',

        'chevron' => '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',

        'lokasi' => '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',

        'dompet' => '<rect x="3" y="6.5" width="18" height="13" rx="2.5"/><path d="M3 10.5h18"/><circle cx="16.5" cy="15" r="1.25"/>',

        'sampah' => '<path d="M4 7h16"/><path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7"/><path d="M6.5 7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/>',

        'hapus' => '<path d="M4 7h16"/><path d="M6.5 7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/>',

        'keluar' => '<path d="M15 17l5-5-5-5"/><path d="M20 12H9"/><path d="M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',

        'edit' => '<path d="M4 20h4.2L19 9.2a1.4 1.4 0 0 0 0-2l-2.2-2.2a1.4 1.4 0 0 0-2 0L4 15.8V20Z"/><path d="M14.5 6.5 17.5 9.5"/>',

        'cari' => '<circle cx="10.8" cy="10.8" r="6.3"/><path d="M15.5 15.5 20 20"/>',

        'pisang' => '<path d="M5 4c.5 6 3.5 11 9.5 13.5 2 .8 4 1 5.5.5"/><path d="M5 4c-1 0-1.8 1-1.5 2 .4 1.5 1.8 2 3 1.8"/><path d="M6 4.5C9 9 12 12.5 17.5 15"/>',

        'es' => '<path d="M7 3h10v5a5 5 0 0 1-10 0V3Z"/><path d="M7 13a5 5 0 0 0 10 0"/><path d="M12 3v18"/><path d="M8.5 6.5h7"/>',

        'daftar' => '<path d="M8 6.5h12M8 12h12M8 17.5h12"/><path d="M4 6.5h.01M4 12h.01M4 17.5h.01"/>',

        'pesanan' => '<path d="M8 5h8"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M8 9.5h8"/><path d="M8 13h8"/><path d="M8 16.5h5"/><path d="M14 16l1.5 1.5L19 14"/>',

        'cetak' => '<path d="M7 9V4h10v5"/><path d="M7 17.5H5.5A1.5 1.5 0 0 1 4 16V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1.5 1.5 0 0 1-1.5 1.5H17"/><path d="M7 14h10v6H7z"/>',

        'jam' => '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',

        'profil' => '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>',

        'masuk' => '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    ];

    // Nama yang tidak dikenal sengaja dapat ikon kosong, bukan diam-diam
    // memakai ikon lain: halaman yang salah ikon kelihatan saat dev,
    // bukan hunted lewat salah klik pengguna.
    $isi = $ikon[$name] ?? '';
@endphp

<svg
    {{ $attributes->merge(['class' => trim('ikon '.$class)]) }}
    width="{{ $size }}"
    height="{{ $size }}"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
>{!! $isi !!}</svg>
