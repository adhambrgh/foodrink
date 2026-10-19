<?php

namespace App\Enums;

/**
 * Tingkat/jenjang kelas. Dipakai bareng jurusan dan kode kelas untuk
 * menentukan ruang tujuan antar.
 */
enum TingkatKelas: string
{
    case Sepuluh = 'X'; // tingkat ke-10 (X)
    case Sebelas = 'XI'; // tingkat ke-11 (XI)
    case DuaBelas = 'XII'; // tingkat ke-12 (XII)

    public function label(): string // label tampilan tingkat kelas
    {
        return match ($this) { // pilih label sesuai tingkat
            self::Sepuluh => 'X (10)', // label X (10)
            self::Sebelas => 'XI (11)', // label XI (11)
            self::DuaBelas => 'XII (12)', // label XII (12)
        };
    }
}
