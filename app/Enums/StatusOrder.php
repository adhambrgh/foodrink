<?php

namespace App\Enums;

enum StatusOrder: string
{
    case MenungguBayar = 'menunggu_bayar';
    case Lunas = 'lunas';
    case Dibuat = 'dibuat';
    case Selesai = 'selesai';
    case Batal = 'batal';
    case Kedaluwarsa = 'kedaluwarsa';

    /**
     * Status yang boleh dipindah dari status ini.
     *
     * Semua perpindahan status divalidasi lewat sini -- bukan di controller
     * atau view -- supaya tidak ada jalur yang bisa melewati aturan.
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::MenungguBayar => [self::Lunas, self::Kedaluwarsa, self::Batal],
            self::Lunas => [self::Dibuat, self::Batal],
            self::Dibuat => [self::Selesai, self::Batal],
            self::Selesai, self::Batal, self::Kedaluwarsa => [],
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
     * Label Bahasa Indonesia untuk badge status.
     */
    public function label(): string
    {
        return match ($this) {
            self::MenungguBayar => 'Menunggu pembayaran',
            self::Lunas => 'Sudah dibayar',
            self::Dibuat => 'Siap diantar',
            self::Selesai => 'Selesai',
            self::Batal => 'Dibatalkan',
            self::Kedaluwarsa => 'Kedaluwarsa',
        };
    }

    /**
     * Nama variabel CSS untuk badge, supaya view tidak perlu switch warna.
     */
    public function warnaCss(): string
    {
        return match ($this) {
            self::MenungguBayar => 'kuning',
            self::Lunas => 'biru',
            self::Dibuat => 'hijau',
            self::Selesai => 'tinta',
            self::Batal, self::Kedaluwarsa => 'abu',
        };
    }
}
