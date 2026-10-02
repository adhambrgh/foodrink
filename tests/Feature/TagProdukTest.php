<?php

use App\Enums\Kategori;
use App\Enums\WarnaTag;
use App\Models\Product;
use App\Models\Tag;
use App\Models\User;

/*
 * Tag = label jualan di katalog. Tiga hal yang dijaga: admin bisa
 * manages tag sendiri, pilih sendiri produk mana yang memakai tag itu, dan
 * katalog tidak lagi menebak-nebak label dari nama produk.
 */

function penjagaTag(): User
{
    return User::factory()->create();
}

it('halaman tag terbuka untuk admin yang login', function () {
    $this->get(route('admin.tag.index'))->assertRedirect(route('admin.login'));

    $this->actingAs(penjagaTag())
        ->get(route('admin.tag.index'))
        ->assertOk()
        ->assertSee('Label di katalog');
});

it('admin bisa membuat tag dengan warna dan urutan', function () {
    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->post(route('admin.tag.store'), [
            'nama' => 'Paling Laris',
            'warna' => WarnaTag::Bata->value,
            'urutan' => 3,
            'tampil_katalog' => '1',
            'sorot' => '1',
        ])
        ->assertRedirect(route('admin.tag.index'))
        ->assertSessionHas('sukses');

    $tag = Tag::where('nama', 'Paling Laris')->first();

    expect($tag)->not->toBeNull()
        ->and($tag->warna)->toBe(WarnaTag::Bata)
        ->and($tag->urutan)->toBe(3)
        ->and($tag->tampil_katalog)->toBeTrue()
        ->and($tag->sorot)->toBeTrue()
        ->and($tag->kelas_css)->toBe('badge--bata');
});

it('nama tag tidak boleh sama dua kali', function () {
    Tag::factory()->create(['nama' => 'Musiman']);

    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->post(route('admin.tag.store'), ['nama' => 'Musiman', 'warna' => WarnaTag::Abu->value])
        ->assertSessionHasErrors('nama');
});

it('warna harus salah satu dari yang dikenal', function () {
    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->post(route('admin.tag.store'), ['nama' => 'Ngawur', 'warna' => 'pelangi'])
        ->assertSessionHasErrors('warna');
});

it('admin bisa mengubah tag yang sudah ada', function () {
    $tag = Tag::factory()->create(['nama' => 'Musiman', 'warna' => WarnaTag::Abu, 'sorot' => false]);

    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->put(route('admin.tag.update', $tag), [
            'nama' => 'Musiman Lagi',
            'warna' => WarnaTag::Biru->value,
            'urutan' => 8,
        ])
        ->assertRedirect(route('admin.tag.index'));

    $tag->refresh();

    expect($tag->nama)->toBe('Musiman Lagi')
        ->and($tag->warna)->toBe(WarnaTag::Biru)
        ->and($tag->urutan)->toBe(8)
        ->and($tag->tampil_katalog)->toBeFalse()
        ->and($tag->sorot)->toBeFalse();
});

it('hapus tag melepaskannya dari semua produk', function () {
    $tag = Tag::factory()->create();
    $produk = Product::factory()->count(2)->create();
    $tag->products()->attach($produk->pluck('id'));

    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->delete(route('admin.tag.destroy', $tag))
        ->assertRedirect(route('admin.tag.index'));

    expect(Tag::find($tag->id))->toBeNull()
        ->and($produk->first()->tags()->count())->toBe(0)
        ->and($produk->first()->exists)->toBeTrue();
});

it('produk yang dihapus tidak meninggalkan tag yatim', function () {
    $tag = Tag::factory()->create();
    $produk = Product::factory()->create();
    $tag->products()->attach($produk->id);

    $produk->delete();

    expect($tag->products()->count())->toBe(0)
        ->and($tag->exists)->toBeTrue();
});

it('admin bisa memilih produk mana yang memakai sebuah tag', function () {
    $tag = Tag::factory()->create();
    $terpilih = Product::factory()->count(2)->create();
    $lain = Product::factory()->create();

    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->put(route('admin.tag.produk', $tag), ['produk' => $terpilih->pluck('id')->all()])
        ->assertRedirect(route('admin.tag.index'))
        ->assertSessionHas('sukses');

    expect($tag->products()->pluck('products.id')->sort()->values()->all())
        ->toBe($terpilih->pluck('id')->sort()->values()->all());

    // Sync, bukan append: produk yang tidak dicentang harus lepas.
    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->put(route('admin.tag.produk', $tag), ['produk' => [$lain->id]]);

    expect($tag->products()->pluck('products.id')->all())->toBe([$lain->id]);
});

it('daftar produk yang tidak ada ditolak', function () {
    $tag = Tag::factory()->create();

    $this->actingAs(penjagaTag())
        ->from(route('admin.tag.index'))
        ->put(route('admin.tag.produk', $tag), ['produk' => [999999]])
        ->assertSessionHasErrors('produk.0');
});

it('katalog menampilkan tag yang memang ditugaskan', function () {
    $laku = Tag::factory()->sorot()->create(['nama' => 'Paling laris', 'warna' => WarnaTag::Bata]);
    $produk = Product::factory()->create([
        'nama' => 'Pisang Nugget Coklat Keju',
        'kategori' => Kategori::PisangNugget,
        'tersedia' => true,
    ]);
    $produk->tags()->attach($laku);

    // Produk tanpa tag sama sekali -- tidak boleh dapat label dari nama.
    Product::factory()->create([
        'nama' => 'Pisang Nugget Keju Susu',
        'kategori' => Kategori::PisangNugget,
        'tersedia' => true,
    ]);

    $this->get(route('katalog'))
        ->assertOk()
        ->assertSee('Paling laris')
        ->assertDontSee('Anak kelas suka');
});

it('tag yang disembunyikan tidak muncul di katalog tapi tetap bisa dipakai', function () {
    $tag = Tag::factory()->hanyaAdmin()->create(['nama' => 'Cicilan Internal']);
    $produk = Product::factory()->create([
        'nama' => 'Es Mamboo Original',
        'kategori' => Kategori::EsMamboo,
        'tersedia' => true,
    ]);
    $produk->tags()->attach($tag);

    $this->get(route('katalog', ['kategori' => Kategori::EsMamboo->value]))
        ->assertOk()
        ->assertDontSee('Cicilan Internal');

    $this->actingAs(penjagaTag())
        ->get(route('admin.tag.index'))
        ->assertOk()
        ->assertSee('Cicilan Internal');
});

it('tag bisa diubah dari form produk', function () {
    $tag = Tag::factory()->create(['nama' => 'Baru']);
    $produk = Product::factory()->create([
        'nama' => 'Kentang Goreng',
        'kategori' => Kategori::PisangNugget,
    ]);

    $this->actingAs(penjagaTag())
        ->put(route('admin.produk.update', $produk), [
            'nama' => $produk->nama,
            'kategori' => $produk->kategori->value,
            'harga' => $produk->harga,
            'stok' => $produk->stok,
            'tag' => [$tag->id],
        ])
        ->assertRedirect(route('admin.produk.index'));

    expect($produk->tags()->pluck('tags.nama')->all())->toBe(['Baru']);

    // Tidak ada tag yang dicentang = semua tag lepas.
    $this->actingAs(penjagaTag())
        ->put(route('admin.produk.update', $produk), [
            'nama' => $produk->nama,
            'kategori' => $produk->kategori->value,
            'harga' => $produk->harga,
            'stok' => $produk->stok,
        ]);

    expect($produk->tags()->count())->toBe(0);
});

it('form produk baru juga bisa langsung diberi tag', function () {
    $tag = Tag::factory()->create();

    $this->actingAs(penjagaTag())
        ->post(route('admin.produk.store'), [
            'nama' => 'Kentang Goreng',
            'kategori' => Kategori::PisangNugget->value,
            'harga' => 8000,
            'stok' => 20,
            'tag' => [$tag->id],
        ])
        ->assertRedirect(route('admin.produk.index'));

    $produk = Product::where('nama', 'Kentang Goreng')->firstOrFail();

    expect($produk->tags()->pluck('tags.nama')->all())->toBe([$tag->nama]);
});

it('tag yang tidak ada tidak bisa dikirim diam-diam', function () {
    $produk = Product::factory()->create();

    $this->actingAs(penjagaTag())
        ->from(route('admin.produk.edit', $produk))
        ->put(route('admin.produk.update', $produk), [
            'nama' => $produk->nama,
            'kategori' => $produk->kategori->value,
            'harga' => $produk->harga,
            'stok' => $produk->stok,
            'tag' => [999999],
        ])
        ->assertSessionHasErrors('tag.0');
});
