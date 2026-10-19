<?php

namespace App\Enums;

enum StatusOrder: string
{
    case MenungguBayar = 'menunggu_bayar'; // menunggu pembayaran
    case Lunas = 'lunas'; // sudah dibayar
    case Selesai = 'selesai'; // pesanan selesai
    case Batal = 'batal'; // pesanan batal

    /**
     * Status yang boleh dipindah dari status ini.
     *
     * Semua perpindahan status divalidasi lewat sini -- bukan di controller
     * atau view -- supaya tidak ada jalur yang bisa melewati aturan.
     */
    public function allowedTransitions(): array // daftar transisi status valid
    {
        return match ($this) { // pilih transisi sesuai status aktif
            self::MenungguBayar => [self::Lunas, self::Batal], // dari menunggu bisa lunas/batal
            self::Lunas => [self::Selesai, self::Batal], // dari lunas bisa selesai/batal
            self::Selesai, self::Batal => [], // status akhir tanpa transisi
        };
    }

    /**
     * Status akhir: tidak ada perpindahan lagi. Halaman status pesanan
     * menghentikan polling kalau ini true.
     */
    public function isTerminal(): bool // cek status sudah final
    {
        return $this->allowedTransitions() === []; // final jika tanpa transisi
    }

    /**
     * Status yang tampil di daftar admin.
     *
     * Menunggu_bayar dan batal sengaja tidak ikut: uangnya belum masuk, jadi
     * petugas tidak punya yang dikerjakan dari dua status itu. Pembeli yang
     * membatalkan juga tidak meninggalkan jejak -- pesanannya dihapus, bukan
     * cuma disembunyikan.
     *
     * @return list<self>
     */
    public static function untukAdmin(): array // daftar status untuk admin
    {
        return [self::Lunas, self::Selesai]; // hanya status yang perlu kerja
    }

    /**
     * Label Bahasa Indonesia untuk badge status.
     */
    public function label(): string // label tampilan status
    {
        return match ($this) { // pilih label sesuai status
            self::MenungguBayar => 'Menunggu pembayaran', // label menunggu bayar
            self::Lunas => 'Sedang diproses', // label lunas
            self::Selesai => 'Selesai', // label selesai
            self::Batal => 'Dibatalkan', // label batal
        };
    }

    /**
     * Nama variabel CSS untuk badge status.
     */
    public function warnaCss(): string // nama warna CSS badge
    {
        return match ($this) { // pilih warna sesuai status
            self::MenungguBayar => 'kuning', // warna menunggu
            self::Lunas => 'biru', // warna diproses
            self::Selesai => 'hijau', // warna selesai
            self::Batal => 'abu', // warna batal
        };
    }
}
