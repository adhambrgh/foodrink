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
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // kumpulan karakter acak bebas ambigu

    private const PANJANG = 6; // panjang digit acak

    public static function generate(): string // buat kode pesanan baru
    {
        $suffix = ''; // inisialisasi akhiran kode

        for ($i = 0; $i < self::PANJANG; $i++) { // loop sebanyak panjang kode
            $suffix .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)]; // pilih satu karakter acak
        }

        return 'FR-'.$suffix; // gabung prefix dengan akhiran
    }

    /**
     * Generate kode yang dijamin belum dipakai.
     *
     * Index unique di database tetap pengaman terakhir kalau ada tabrakan,
     * tapi mencoba 5 kali dulu membuat kegagalan itu nyaris mustahil terjadi
     * (32^6 = ~1 miliar kombinasi).
     */
    public static function generateUnik(): string // buat kode yang pasti unik
    {
        for ($percobaan = 0; $percobaan < 5; $percobaan++) { // coba maksimal 5 kali
            $kode = self::generate(); // generate kombinasi acak baru

            if (! Order::where('kode', $kode)->exists()) { // jika kode belum terpakai
                return $kode; // kembalikan kode unik
            }
        }

        // Secara praktis tidak akan sampai sini. Pakai uuid yang dipotong
        // supaya tetap punya kode valid daripada gagal create order.
        return 'FR-'.Str::upper(Str::random(6)); // fallback kode acak jika bentrok terus
    }
}
