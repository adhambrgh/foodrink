<?php

namespace App\Enums;

enum Kategori: string
{
    case PisangNugget = 'pisang_nugget';
    case EsMaboo = 'es_maboo';

    /**
     * Label yang tampil di katalog.
     */
    public function label(): string
    {
        return match ($this) {
            self::PisangNugget => 'Pisang Nugget',
            self::EsMaboo => 'Es Maboo',
        };
    }
}
