<?php

namespace App\Support;

use App\Models\Order;
use Illuminate\Support\Str;

class KodePesanan
{
    /**
     * Alphabet tanpa I, O, 0, dan 1 supaya kode tidak ambigu saat dibaca
     * keras di depan kelas.
     */
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const PANJANG = 6;

    public static function generate(): string
    {
        $suffix = '';

        for ($i = 0; $i < self::PANJANG; $i++) {
            $suffix .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return 'FR-'.$suffix;
    }

    /**
     * Generate kode yang dijamin belum dipakai.
     *
     * Index unique di database tetap pengaman terakhir kalau ada tabrakan,
     * tapi mencoba 5 kali dulu membuat kegagalan itu nyaris mustahil terjadi
     * (32^6 = ~1 miliar kombinasi).
     */
    public static function generateUnik(): string
    {
        for ($percobaan = 0; $percobaan < 5; $percobaan++) {
            $kode = self::generate();

            if (! Order::where('kode', $kode)->exists()) {
                return $kode;
            }
        }

        // Secara praktis tidak akan sampai sini. Pakai uuid yang dipotong
        // supaya tetap punya kode valid daripada gagal create order.
        return 'FR-'.Str::upper(Str::random(6));
    }
}
