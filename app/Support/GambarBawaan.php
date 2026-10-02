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
    public static function url(string $nama, ?int $width = null): ?string
    {
        if ($width !== null) {
            $webp = "images/{$nama}-{$width}.webp";
            if (file_exists(public_path($webp))) {
                return asset($webp);
            }
        }

        foreach (['png', 'jpg', 'jpeg', 'webp'] as $ext) {
            $rel = "images/{$nama}.{$ext}";
            if (file_exists(public_path($rel))) {
                return asset($rel);
            }
        }

        return null;
    }
}
