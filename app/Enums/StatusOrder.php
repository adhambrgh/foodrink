<?php

namespace App\Enums;

enum StatusOrder: string
{
    case MenungguBayar = 'menunggu_bayar';
    case Lunas = 'lunas';
    case Selesai = 'selesai';
    case Batal = 'batal';

    /**
     * Status yang boleh dipindah dari status ini.
     *
     * Semua perpindahan status divalidasi lewat sini -- bukan di controller
     * atau view -- supaya tidak ada jalur yang bisa melewati aturan.
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::MenungguBayar => [self::Lunas, self::Batal],
            self::Lunas => [self::Selesai, self::Batal],
            self::Selesai, self::Batal => [],
        };
    }

    /**
     * Status akhir: tidak ada perpindahan lagi. Halaman status pesanan
     * menghentikan polling kalau ini true.
     */
    public function isTerminal(): bool
    {
        return $this->allowedTransitions() === [];
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
    public static function untukAdmin(): array
    {
        return [self::Lunas, self::Selesai];
    }

    /**
     * Label Bahasa Indonesia untuk badge status.
     */
    public function label(): string
    {
        return match ($this) {
            self::MenungguBayar => 'Menunggu pembayaran',
            self::Lunas => 'Sedang diproses',
            self::Selesai => 'Selesai',
            self::Batal => 'Dibatalkan',
        };
    }

    /**
     * Nama variabel CSS untuk badge status.
     */
    public function warnaCss(): string
    {
        return match ($this) {
            self::MenungguBayar => 'kuning',
            self::Lunas => 'biru',
            self::Selesai => 'hijau',
            self::Batal => 'abu',
        };
    }
}
