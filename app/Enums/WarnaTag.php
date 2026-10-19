<?php

namespace App\Enums;

/**
 * Warna label di katalog. Nilainya sama persis dengan nama kelas CSS
 * badge--* supaya view tidak perlu switch warna sendiri.
 */
enum WarnaTag: string
{
    case Bata = 'bata'; // warna merah bata
    case Kuning = 'kuning'; // warna kuning
    case Hijau = 'hijau'; // warna hijau
    case Biru = 'biru'; // warna biru
    case Abu = 'abu'; // warna abu-abu
    case Tinta = 'tinta'; // warna hitam tinta

    public function kelasCss(): string // nama kelas CSS badge
    {
        return 'badge--'.$this->value; // gabung prefix badge dengan nilai enum
    }

    public function label(): string // label warna untuk tampilan
    {
        return match ($this) { // pilih label sesuai warna
            self::Bata => 'Merah', // label untuk bata
            self::Kuning => 'Kuning', // label untuk kuning
            self::Hijau => 'Hijau', // label untuk hijau
            self::Biru => 'Biru', // label untuk biru
            self::Abu => 'Abu-abu', // label untuk abu
            self::Tinta => 'Hitam', // label untuk tinta
        };
    }
}
