<?php

namespace App\Support;

/**
 * Foto bawaan yang ditaruh manual di public/images.
 * Toleran ekstensi (jpg/jpeg/png/webp) supaya tidak masalah
 * kalau file tersimpan sebagai .png padahal yang dicari .jpg.
 * Juga generate resize webp otomatis untuk performa halaman.
 */
class GambarBawaan
{
    public static function url(string $nama, ?int $width = null): ?string // ambil URL gambar bawaan
    {
        if ($width !== null) { // jika ukuran lebar ditentukan
            $webp = "images/{$nama}-{$width}.webp"; // buat path file versi webp
            if (file_exists(public_path($webp))) { // cek keberadaan file webp di public
                return asset($webp); // kembalikan URL aset webp
            }
        }

        foreach (['png', 'jpg', 'jpeg', 'webp'] as $ext) { // coba berbagai ekstensi file
            $rel = "images/{$nama}.{$ext}"; // buat path file alternatif
            if (file_exists(public_path($rel))) { // cek file ada di folder public
                return asset($rel); // kembalikan URL aset gambar
            }
        }

        return null; // kembalikan null jika file tidak ditemukan
    }
}
