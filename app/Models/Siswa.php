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
    use HasFactory, Notifiable; // factory dan notifikasi untuk model siswa

    // Tabelnya tunggal ("siswa") karena yang diistirahawakan adalah orangnya,
    // bukan kumpulan. Tanpa ini Eloquent akan mencari tabel "siswas".
    protected $table = 'siswa'; // paksa nama tabel tunggal siswa

    protected $fillable = [ // kolom yang boleh diisi mass-assignment
        'nis',
        'nama',
        'tingkat',
        'jurusan',
        'kode_kelas',
        'ruang',
        'password',
    ];

    protected $hidden = [ // kolom yang disembunyikan dari serialisasi
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array // tentukan konversi tipe data kolom
    {
        return [
            'tingkat' => TingkatKelas::class, // cast ke enum TingkatKelas
            'jurusan' => Jurusan::class, // cast ke enum Jurusan
            'kode_kelas' => KodeKelas::class, // cast ke enum KodeKelas
            'password' => 'hashed', // enkripsi otomatis kata sandi
        ];
    }

    /**
     * NIS dibersihkan spasinya supaya " 20240001 " dianggap sama dengan
     * "20240001" dan tidak bisa dipakai mendaftar dua kali.
     */
    public function setNisAttribute(string $value): void // mutator untuk membersihkan nilai NIS
    {
        $this->attributes['nis'] = trim($value); // bersihkan spasi awal dan akhir
    }

    public function orders(): HasMany // relasi pesanan milik siswa
    {
        return $this->hasMany(Order::class); // satu siswa punya banyak order
    }

    public function keranjang(): HasOne // relasi keranjang milik siswa
    {
        return $this->hasOne(Keranjang::class); // satu siswa punya satu keranjang
    }

    /**
     * Untuk form pemesanan: kelas dan ruangan yang tersimpan di profil,
     * supaya siswa tidak perlu mengetik ulang tiap memesan.
     *
     * @return array{nama: string, tingkat: string|null, jurusan: string|null, kode_kelas: string|null, ruang: string|null}
     */
    public function tujuanAntar(): array // data alamat antar default profil
    {
        return [
            'nama' => $this->nama, // nama lengkap siswa
            'tingkat' => $this->tingkat?->value, // nilai enum tingkat
            'jurusan' => $this->jurusan?->value, // nilai enum jurusan
            'kode_kelas' => $this->kode_kelas?->value, // nilai enum kode kelas
            'ruang' => $this->ruang, // nama atau nomor ruangan
        ];
    }
}
