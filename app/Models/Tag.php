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
    use HasFactory;

    protected $fillable = [
        'nama',
        'warna',
        'tampil_katalog',
        'sorot',
        'urutan',
    ];

    protected function casts(): array
    {
        return [
            'warna' => WarnaTag::class,
            'tampil_katalog' => 'boolean',
            'sorot' => 'boolean',
            'urutan' => 'integer',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withTimestamps();
    }

    /**
     * Urutan tampil di katalog dan admin: urutan dulu, nama sebagai
     * pemutus supaya tidak loncat-loncat saat urutannya sama.
     */
    public function scopeUrut(Builder $query): Builder
    {
        return $query->orderBy('urutan')->orderBy('nama');
    }

    public function getKelasCssAttribute(): string
    {
        return $this->warna instanceof WarnaTag ? $this->warna->kelasCss() : 'badge--abu';
    }
}
