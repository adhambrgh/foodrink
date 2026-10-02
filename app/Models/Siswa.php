<?php

namespace App\Models;

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\TingkatKelas;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Siswa yang membeli jajan.
 *
 * Sengaja terpisah dari App\Models\User: tabel `users` berarti "admin"
 * di aplikasi ini, dan route /admin dilindungi middleware auth. Kalau
 * siswa memakai tabel yang sama, setiap siswa yang daftar akan ikut
 * lolos ke sana karena tidak ada kolom yang membedakan keduanya.
 *
 * Identitasnya NIS, bukan email. Sekolah sudah punya NIS yang pasti
 * unik untuk setiap siswa, dan siswa tidak perlu remembering email
 * tambahan yang harus dibuat-buat.
 */
class Siswa extends Authenticatable
{
    /** @use HasFactory<SiswaFactory> */
    use HasFactory, Notifiable;

    // Tabelnya tunggal ("siswa") karena yang diistirahawakan adalah orangnya,
    // bukan kumpulan. Tanpa ini Eloquent akan mencari tabel "siswas".
    protected $table = 'siswa';

    protected $fillable = [
        'nis',
        'nama',
        'tingkat',
        'jurusan',
        'kode_kelas',
        'ruang',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tingkat' => TingkatKelas::class,
            'jurusan' => Jurusan::class,
            'kode_kelas' => KodeKelas::class,
            'password' => 'hashed',
        ];
    }

    /**
     * NIS dibersihkan spasinya supaya " 20240001 " dianggap sama dengan
     * "20240001" dan tidak bisa dipakai mendaftar dua kali.
     */
    public function setNisAttribute(string $value): void
    {
        $this->attributes['nis'] = trim($value);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function keranjang(): HasOne
    {
        return $this->hasOne(Keranjang::class);
    }

    /**
     * Untuk form pemesanan: kelas dan ruangan yang tersimpan di profil,
     * supaya siswa tidak perlu mengetik ulang tiap memesan.
     *
     * @return array{nama: string, tingkat: string|null, jurusan: string|null, kode_kelas: string|null, ruang: string|null}
     */
    public function tujuanAntar(): array
    {
        return [
            'nama' => $this->nama,
            'tingkat' => $this->tingkat?->value,
            'jurusan' => $this->jurusan?->value,
            'kode_kelas' => $this->kode_kelas?->value,
            'ruang' => $this->ruang,
        ];
    }
}
