<?php

use App\Models\Keranjang;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Setiap test di folder Feature memakai Tests\TestCase (Laravel di-bind ke
| app) plus RefreshDatabase supaya database test dibersihkan di awal tiap
| test. Folder Unit tidak di-bind ke app karena tidak butuh booting Laravel.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Helper Siswa
|--------------------------------------------------------------------------
|
| Guard `siswa` terpisah dari guard `web`, jadi setiap test yang menyentuh
| keranjang, checkout, atau riwayat harus login sebagai siswa lebih dulu.
| Dipisah dari test admin supaya tidak ada yang diam-diam memakai akun admin.
|
*/

function siswa(array $atribut = []): Siswa
{
    return Siswa::factory()->create($atribut);
}

/**
 * Login sebagai siswa dan kembalikan modelnya, supaya test bisa langsung
 * mengisi keranjang atau menyetel `siswa_id` di order.
 */
function actingSiswa(array $atribut = []): Siswa
{
    $siswa = siswa($atribut);

    test()->actingAs($siswa, 'siswa');

    return $siswa;
}

/**
 * Isi keranjang DB siswa tanpa lewat HTTP, untuk test yang fokusnya bukan
 * di alur `prepare`.
 *
 * @param  list<array{id: int, jumlah?: int}>  $baris
 */
function isiKeranjang(Siswa $siswa, array $baris): Keranjang
{
    $keranjang = $siswa->keranjang()->firstOrCreate();

    $keranjang->isiDengan($baris);

    return $keranjang->fresh();
}

/**
 * Data penerima yang lolos validasi `prepare()`.
 *
 * @return array<string, string>
 */
function penerimaSiap(array $ubah = []): array
{
    return array_merge([
        'nama' => 'Rina',
        'ruang' => 'Ruang 204',
        'tingkat' => 'X',
        'jurusan' => 'RPL',
        'kode_kelas' => 'A',
    ], $ubah);
}
