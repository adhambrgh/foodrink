<?php

namespace App\Models;

use App\Enums\WarnaTag;
use Database\Factories\TagFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Label/promo yang menempel ke produk, misal "Paling Laris" atau diskon.
 * Dipakai untuk filter & tampilan katalog maupun admin, dikelola
 * relasi many-to-many lewat tabel pivot `product_tag`.
 */
class Tag extends Model
{
    /** @use HasFactory<TagFactory> */
    use HasFactory; // trait factory untuk pembuatan data testing

    protected $fillable = [ // kolom yang boleh diisi mass-assignment
        'nama',
        'warna',
        'tampil_katalog',
        'sorot',
        'urutan',
    ];

    protected function casts(): array // tentukan konversi tipe data kolom
    {
        return [
            'warna' => WarnaTag::class, // cast warna jadi enum WarnaTag
            'tampil_katalog' => 'boolean', // cast boolean tampil katalog
            'sorot' => 'boolean', // cast boolean sorot
            'urutan' => 'integer', // cast urutan jadi integer
        ];
    }

    public function products(): BelongsToMany // relasi produk lewat pivot tag
    {
        return $this->belongsToMany(Product::class)->withTimestamps(); // relasi many-to-many dengan timestamp
    }

    /**
     * Urutan tampil di katalog dan admin: urutan dulu, nama sebagai
     * pemutus supaya tidak loncat-loncat saat urutannya sama.
     */
    public function scopeUrut(Builder $query): Builder // scope urutan tag
    {
        return $query->orderBy('urutan')->orderBy('nama'); // urutkan berdasarkan urutan lalu nama
    }

    public function getKelasCssAttribute(): string // accessor kelas CSS badge
    {
        return $this->warna instanceof WarnaTag ? $this->warna->kelasCss() : 'badge--abu'; // gunakan kelas warna atau default abu
    }
}
