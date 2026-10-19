<?php

namespace App\Enums;

/**
 * Jurusan yang ada di sekolah. Daftar ini yang muncul di dropdown, jadi
 * menambah jurusan cukup di sini.
 */
enum Jurusan: string
{
    case Rpl = 'RPL'; // jurusan RPL
    case Tkj = 'TKJ'; // jurusan TKJ
    case Dkv = 'DKV'; // jurusan DKV
    case Tg = 'TG'; // jurusan TG
    case Anim = 'ANIM'; // jurusan Animasi
    case Mekanika = 'MEKA'; // jurusan Mekatronika
    case Log = 'LOG'; // jurusan Logistik
    case Ph = 'PH'; // jurusan Perhotelan

    public function label(): string // label tampilan jurusan
    {
        return match ($this) { // pilih label sesuai jurusan
            self::Rpl => 'RPL (Rekayasa Perangkat Lunak)', // label lengkap RPL
            self::Tkj => 'TKJ (Teknik Komputer dan Jaringan)', // label lengkap TKJ
            self::Dkv => 'DKV (Desain Komunikasi Visual)', // label lengkap DKV
            self::Tg => 'TG (Teknik Grafika)', // label lengkap TG
            self::Anim => 'ANIM (Animasi)', // label lengkap Anim
            self::Mekanika => 'MEKA (Mekatronika)', // label lengkap Mekanika
            self::Log => 'LOG (Logistik)', // label lengkap Log
            self::Ph => 'PH (Perhotelan)', // label lengkap PH
        };
    }

    /**
     * Nama pendek buat ditampilkan di daftar admin, di mana ruangannya
     * sempit dan label panjang cuma bikin berantakan.
     */
    public function labelPendek(): string // label pendek untuk admin
    {
        return $this->value; // kembalikan nilai singkat
    }
}
