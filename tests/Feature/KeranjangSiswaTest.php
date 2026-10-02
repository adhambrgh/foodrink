<?php

use App\Models\Product;
use App\Models\Siswa;

it('login siswa tidak mengaktifkan guard admin', function () {
    $siswa = actingSiswa();

    expect(auth('siswa')->user())->toBeInstanceOf(Siswa::class)
        ->and(auth('siswa')->user()->id)->toBe($siswa->id)
        ->and(auth()->guard('web')->check())->toBeFalse();
});

it('keranjang tiap siswa terpisah dan tidak saling membaca', function () {
    $produk = Product::factory()->create(['stok' => 20, 'harga' => 1000]);

    $budi = actingSiswa();
    $siti = actingSiswa();

    isiKeranjang($budi, [['id' => $produk->id, 'jumlah' => 2]]);

    expect($budi->keranjang->isi())->toHaveCount(1)
        ->and($siti->keranjang)->toBeNull();
});

it('prepare menolak request tanpa login', function () {
    $produk = Product::factory()->create(['stok' => 5]);

    $this->postJson(route('checkout.prepare'), [
        'cara_bayar' => 'tunai',
        'penerima' => penerimaSiap(),
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
    ])->assertUnauthorized();
});

it('prepare menyimpan isi keranjang ke akun siswa', function () {
    $produk = Product::factory()->create(['stok' => 5, 'harga' => 1000]);
    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cara_bayar' => 'tunai',
        'penerima' => penerimaSiap(),
        'cart' => [['id' => $produk->id, 'jumlah' => 2]],
    ])->assertOk();

    $isi = $siswa->keranjang()->firstOrCreate()->isi();

    expect($isi)->toHaveCount(1)
        ->and($isi[0]['jumlah'])->toBe(2)
        ->and($siswa->keranjang()->firstOrCreate()->total())->toBe(2000)
        ->and(session('penerima.nama'))->toBe('Rina');
});

it('prepare mengganti isi keranjang, bukan menumpuk', function () {
    $a = Product::factory()->create(['stok' => 5]);
    $b = Product::factory()->create(['stok' => 5]);
    $siswa = actingSiswa();

    isiKeranjang($siswa, [['id' => $a->id, 'jumlah' => 2]]);

    $this->postJson(route('checkout.prepare'), [
        'cara_bayar' => 'tunai',
        'penerima' => penerimaSiap(),
        'cart' => [['id' => $b->id, 'jumlah' => 1]],
    ])->assertOk();

    $isi = $siswa->keranjang()->firstOrCreate()->isi();

    expect($isi)->toHaveCount(1)
        ->and($isi[0]['id'])->toBe($b->id);
});

it('keranjang membuang produk yang stoknya sudah habis', function () {
    $ada = Product::factory()->create(['stok' => 2]);
    $habis = Product::factory()->create(['stok' => 0]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [
        ['id' => $ada->id, 'jumlah' => 2],
        ['id' => $habis->id, 'jumlah' => 1],
    ]);

    $isi = $siswa->keranjang->isi();

    expect($isi)->toHaveCount(1)
        ->and($isi[0]['id'])->toBe($ada->id);
});
