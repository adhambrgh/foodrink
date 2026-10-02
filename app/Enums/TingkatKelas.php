<?php

namespace App\Enums;

/**
 * Tingkat/jenjang kelas. Dipakai bareng jurusan dan kode kelas untuk
 * menentukan ruang tujuan antar.
 */
enum TingkatKelas: string
{
    case Sepuluh = 'X';
    case Sebelas = 'XI';
    case DuaBelas = 'XII';

    public function label(): string
    {
        return match ($this) {
            self::Sepuluh => 'X (10)',
            self::Sebelas => 'XI (11)',
            self::DuaBelas => 'XII (12)',
        };
    }
}
