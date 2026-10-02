<?php

namespace App\Enums;

/**
 * Jurusan yang ada di sekolah. Daftar ini yang muncul di dropdown, jadi
 * menambah jurusan cukup di sini.
 */
enum Jurusan: string
{
    case Rpl = 'RPL';
    case Tkj = 'TKJ';
    case Dkv = 'DKV';
    case Tg = 'TG';
    case Anim = 'ANIM';
    case Mekanika = 'MEKA';
    case Log = 'LOG';
    case Ph = 'PH';

    public function label(): string
    {
        return match ($this) {
            self::Rpl => 'RPL (Rekayasa Perangkat Lunak)',
            self::Tkj => 'TKJ (Teknik Komputer dan Jaringan)',
            self::Dkv => 'DKV (Desain Komunikasi Visual)',
            self::Tg => 'TG (Teknik Grafika)',
            self::Anim => 'ANIM (Animasi)',
            self::Mekanika => 'MEKA (Mekatronika)',
            self::Log => 'LOG (Logistik)',
            self::Ph => 'PH (Perhotelan)',
        };
    }

    /**
     * Nama pendek buat ditampilkan di daftar admin, di mana ruangannya
     * sempit dan label panjang cuma bikin berantakan.
     */
    public function labelPendek(): string
    {
        return $this->value;
    }
}
