<?php

namespace App\Enums;

enum Kategori: string
{
    case PisangNugget = 'pisang_nugget';
    case EsMamboo = 'es_mamboo';

    /**
     * Label yang tampil di katalog.
     */
    public function label(): string
    {
        return match ($this) {
            self::PisangNugget => 'Pisang Nugget',
            self::EsMamboo => 'Es Mamboo',
        };
    }
}
