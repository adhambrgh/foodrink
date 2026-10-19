<?php

namespace App\Enums;

/**
 * Kode kelas di dalam satu tingkat + jurusan, mis. "X RPL A" adalah
 * tingkat X, jurusan RPL, kode A. Huruf A sampai H dipakai supaya
 * tidak bentrok dengan nomor yang biasa dipakai untuk absensi.
 */
enum KodeKelas: string
{
    case A = 'A'; // kode kelas A
    case B = 'B'; // kode kelas B
    case C = 'C'; // kode kelas C
    case D = 'D'; // kode kelas D
    case E = 'E'; // kode kelas E
    case F = 'F'; // kode kelas F
    case G = 'G'; // kode kelas G
    case H = 'H'; // kode kelas H

    public function label(): string // label tampilan kode kelas
    {
        return $this->value; // kembalikan nilai kode kelas
    }
}
