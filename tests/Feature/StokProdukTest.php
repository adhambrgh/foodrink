<?php

use App\Enums\Kategori;
use App\Models\Product;
use App\Models\User;

/*
 * Stok harus berlaku dari ujung ke ujung: admin bisa ubah, katalog
 * jujur soal sisa porsi, dan checkout tidak boleh melebihi stok. Harga
 * dan jumlah selalu diambil dari database, ongkir tidak ada.
 */

function admin(): User
{
    return User::factory()->create();
}

it('admin bisa ubah stok langsung dari daftar produk', function () {
    $produk = Product::factory()->create(['stok' => 12]);

    $this->actingAs(admin())
        ->from(route('admin.produk.index'))
        ->patch(route('admin.produk.stok', $produk), ['stok' => 3])
        ->assertRedirect(route('admin.produk.index'));

    expect($produk->fresh()->stok)->toBe(3);
});

it('stok tidak boleh minus dari nol', function () {
    $produk = Product::factory()->create(['stok' => 5]);

    $this->actingAs(admin())
        ->from(route('admin.produk.index'))
        ->patch(route('admin.produk.stok', $produk), ['stok' => -1])
        ->assertSessionHasErrors('stok');

    expect($produk->fresh()->stok)->toBe(5);
});

it('daftar admin bisa disaring stok menipis dan dicari', function () {
    Product::factory()->create(['nama' => 'Pisang Nugget Coklat Keju', 'stok' => 2]);
    Product::factory()->create(['nama' => 'Es Mamboo Mangga', 'stok' => 30]);

    $this->actingAs(admin())
        ->get(route('admin.produk.index', ['menipis' => 1]))
        ->assertOk()
        ->assertSee('Pisang Nugget Coklat Keju')
        ->assertDontSee('Es Mamboo Mangga');

    $this->actingAs(admin())
        ->get(route('admin.produk.index', ['q' => 'keju']))
        ->assertOk()
        ->assertSee('Pisang Nugget Coklat Keju')
        ->assertDontSee('Es Mamboo Mangga');
});

it('katalog bisa disaring per kategori dan angkanya sesuai isinya', function () {
    Product::factory()->count(2)->create([
        'nama' => 'Pisang Nugget Coklat Keju',
        'kategori' => Kategori::PisangNugget,
        'tersedia' => true,
    ]);
    Product::factory()->create([
        'nama' => 'Es Mamboo Mangga',
        'kategori' => Kategori::EsMamboo,
        'tersedia' => true,
    ]);

    // Tanpa parameter, katalog membuka kategori defaults (pisang nugget).
    $this->get(route('katalog'))
        ->assertOk()
        ->assertSee('Pisang Nugget Coklat Keju')
        ->assertDontSee('Es Mamboo Mangga');

    $this->get(route('katalog', ['kategori' => Kategori::PisangNugget->value]))
        ->assertOk()
        ->assertSee('Pisang Nugget Coklat Keju')
        ->assertDontSee('Es Mamboo Mangga');

    $this->get(route('katalog', ['kategori' => Kategori::EsMamboo->value]))
        ->assertOk()
        ->assertSee('Es Mamboo Mangga')
        ->assertDontSee('Pisang Nugget Coklat Keju');

    // Jumlah di tiap tab harus berbeda: 2 pisang nugget, 1 es mamboo.
    $halaman = $this->get(route('katalog'))->assertOk();
    $halaman->assertSeeInOrder(['Pisang Nugget', '(2)', 'Es Mamboo', '(1)']);

    // Kategori ngawur tidak boleh bikin 500.
    $this->get(route('katalog', ['kategori' => 'ngawur']))->assertOk();
});

it('produk stok nol tampil sebagai habis di katalog', function () {
    Product::factory()->create([
        'nama' => 'Pisang Nugget Coklat Keju',
        'kategori' => Kategori::PisangNugget,
        'stok' => 0,
    ]);

    $this->get(route('katalog'))
        ->assertOk()
        ->assertSee('Habis')
        ->assertSee('data-stok="0"', false);
});

it('katalog menampilkan sisa stok untuk produk yang masih ada', function () {
    Product::factory()->create([
        'nama' => 'Pisang Nugget Original',
        'kategori' => Kategori::PisangNugget,
        'stok' => 40,
    ]);

    $this->get(route('katalog'))
        ->assertOk()
        ->assertSee('Sisa 40')
        ->assertSee('data-stok="40"', false);
});

it('checkout tidak menambah ongkir ke total', function () {
    $produk = Product::factory()->create(['harga' => 12000, 'stok' => 2]);
    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cara_bayar' => 'tunai',
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => penerimaSiap(),
    ])->assertOk();

    $total = $siswa->keranjang()->firstOrCreate()->total();

    expect($total)->toBe(12000);
});

it('checkout memakai harga database dan memotong jumlah ke stok', function () {
    $produk = Product::factory()->create(['harga' => 12000, 'stok' => 2]);
    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cara_bayar' => 'tunai',
        'cart' => [
            // Browser ngirim harga sendiri dan minta 9 pcs: harus diabaikan.
            ['id' => $produk->id, 'nama' => 'Palsu', 'harga' => 1, 'jumlah' => 9],
        ],
        'penerima' => penerimaSiap(),
    ])->assertOk();

    $keranjang = $siswa->keranjang()->firstOrCreate()->isi();

    expect($keranjang)->toHaveCount(1)
        ->and($keranjang[0]['harga'])->toBe(12000)
        ->and($keranjang[0]['jumlah'])->toBe(2);
});

it('produk habis dibuang dari keranjang saat checkout', function () {
    $habis = Product::factory()->create(['stok' => 0]);
    $ada = Product::factory()->create(['stok' => 5]);
    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cara_bayar' => 'tunai',
        'cart' => [
            ['id' => $habis->id, 'jumlah' => 1],
            ['id' => $ada->id, 'jumlah' => 1],
        ],
        'penerima' => penerimaSiap(),
    ])->assertOk();

    $keranjang = $siswa->keranjang()->firstOrCreate()->isi();

    expect($keranjang)->toHaveCount(1)
        ->and($keranjang[0]['id'])->toBe($ada->id);
});
