<?php

namespace App\Enums;

/**
 * Kode kelas di dalam satu tingkat + jurusan, mis. "X RPL A" adalah
 * tingkat X, jurusan RPL, kode A. Huruf A sampai H dipakai supaya
 * tidak bentrok dengan nomor yang biasa dipakai untuk absensi.
 */
enum KodeKelas: string
{
    case A = 'A';
    case B = 'B';
    case C = 'C';
    case D = 'D';
    case E = 'E';
    case F = 'F';
    case G = 'G';
    case H = 'H';

    public function label(): string
    {
        return $this->value;
    }
}
