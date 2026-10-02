<?php

namespace App\Enums;

/**
 * Warna label di katalog. Nilainya sama persis dengan nama kelas CSS
 * badge--* supaya view tidak perlu switch warna sendiri.
 */
enum WarnaTag: string
{
    case Bata = 'bata';
    case Kuning = 'kuning';
    case Hijau = 'hijau';
    case Biru = 'biru';
    case Abu = 'abu';
    case Tinta = 'tinta';

    public function kelasCss(): string
    {
        return 'badge--'.$this->value;
    }

    public function label(): string
    {
        return match ($this) {
            self::Bata => 'Merah',
            self::Kuning => 'Kuning',
            self::Hijau => 'Hijau',
            self::Biru => 'Biru',
            self::Abu => 'Abu-abu',
            self::Tinta => 'Hitam',
        };
    }
}
