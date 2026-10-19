<?php

namespace App\Enums;

enum Kategori: string
{
    case PisangNugget = 'pisang_nugget'; // kategori pisang nugget
    case EsMamboo = 'es_mamboo'; // kategori es mambo

    /**
     * Label yang tampil di katalog.
     */
    public function label(): string // label tampilan kategori
    {
        return match ($this) { // pilih label sesuai kategori
            self::PisangNugget => 'Pisang Nugget', // label pisang nugget
            self::EsMamboo => 'Es Mamboo', // label es mambo
        };
    }
}
