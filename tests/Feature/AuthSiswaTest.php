<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\Siswa;
use App\Models\User;

it('halaman masuk dan daftar terbuka untuk tamu', function () {
    $this->get(route('siswa.masuk'))
        ->assertOk()
        ->assertSee('Masuk')
        ->assertSee('name="nis"', false)
        ->assertSee('Daftar dulu', false);

    $this->get(route('siswa.daftar'))
        ->assertOk()
        ->assertSee('Buat akun')
        ->assertSee('name="kode_kelas"', false)
        ->assertSee('name="password_confirmation"', false);
});

it('siswa bisa mendaftar lalu langsung login', function () {
    $this->post(route('siswa.daftar.aksi'), [
        'nis' => '20240001',
        'nama' => 'Rina',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
        'tingkat' => 'X',
        'jurusan' => 'RPL',
        'kode_kelas' => 'A',
        'ruang' => 'Ruang 204',
    ])
        ->assertRedirect(route('keranjang'))
        ->assertSessionHas('sukses');

    $siswa = Siswa::where('nis', '20240001')->firstOrFail();

    expect(auth('siswa')->check())->toBeTrue()
        ->and($siswa->nama)->toBe('Rina')
        // Password harus tersimpan sebagai hash, bukan teks biasa.
        ->and($siswa->password)->not->toBe('rahasia123')
        ->and(\Illuminate\Support\Facades\Hash::check('rahasia123', $siswa->password))->toBeTrue();
});

it('NIS ganda ditolak saat pendaftaran', function () {
    siswa(['nis' => '20240002']);

    $this->post(route('siswa.daftar.aksi'), [
        'nis' => '20240002',
        'nama' => 'Budi',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
    ])
        ->assertSessionHasErrors('nis');

    expect(Siswa::where('nis', '20240002')->count())->toBe(1)
        ->and(auth('siswa')->check())->toBeFalse();
});

it('siswa bisa login dengan NIS dan kata sandi', function () {
    $siswa = siswa(['nis' => '20240003', 'password' => 'rahasia123']);

    $this->post(route('siswa.masuk.aksi'), [
        'nis' => '20240003',
        'password' => 'rahasia123',
    ])->assertRedirect(route('keranjang'));

    expect(auth('siswa')->check())->toBeTrue()
        ->and(auth('siswa')->user()->id)->toBe($siswa->id);
});

it('login ditolak kalau NIS atau kata sandi salah', function () {
    siswa(['nis' => '20240004', 'password' => 'rahasia123']);

    $this->post(route('siswa.masuk.aksi'), [
        'nis' => '20240004',
        'password' => 'salah-total',
    ])->assertSessionHasErrors('nis');

    expect(auth('siswa')->check())->toBeFalse();

    $this->post(route('siswa.masuk.aksi'), [
        'nis' => '99999999',
        'password' => 'rahasia123',
    ])->assertSessionHasErrors('nis');

    expect(auth('siswa')->check())->toBeFalse();
});

it('login siswa tidak memberi akses ke guard admin', function () {
    siswa(['nis' => '20240005', 'password' => 'rahasia123']);

    $this->post(route('siswa.masuk.aksi'), [
        'nis' => '20240005',
        'password' => 'rahasia123',
    ]);

    expect(auth('siswa')->check())->toBeTrue()
        ->and(auth()->guard('web')->check())->toBeFalse();

    // Admin tetap minta login sendiri.
    $this->get(route('admin.pesanan.index'))
        ->assertRedirect(route('admin.login'));
});

it('admin yang login tidak otomatis jadi siswa', function () {
    $this->actingAs(User::factory()->create());

    expect(auth()->guard('web')->check())->toBeTrue()
        ->and(auth('siswa')->check())->toBeFalse();

    $this->get(route('keranjang'))->assertOk();
});

it('keluar hanya menutup sesi siswa, akun admin tidak ikut tertutup', function () {
    $admin = User::factory()->create();
    $this->actingAs($admin);

    actingSiswa(['nis' => '20240006']);

    $this->post(route('siswa.keluar'))->assertRedirect(route('katalog'));

    expect(auth('siswa')->check())->toBeFalse()
        // Admin di tab lain tidak boleh ikut logout karena siswa keluar.
        ->and(auth()->guard('web')->check())->toBeTrue()
        ->and(auth()->guard('web')->user()->id)->toBe($admin->id);
});

it('keranjang siswa tetap ada setelah keluar lalu login lagi', function () {
    $produk = Product::factory()->create(['stok' => 5, 'harga' => 1000]);
    $siswa = siswa(['nis' => '20240007', 'password' => 'rahasia123']);

    $this->actingAs($siswa, 'siswa');
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 2]]);

    $this->post(route('siswa.keluar'))->assertRedirect(route('katalog'));

    // Cookie/session browser dibuang total, lalu login ulang.
    $this->flushSession();

    $this->post(route('siswa.masuk.aksi'), [
        'nis' => '20240007',
        'password' => 'rahasia123',
    ])->assertRedirect(route('keranjang'));

    $this->get(route('keranjang'))
        ->assertOk()
        ->assertSee($produk->nama)
        ->assertSee('2');

    expect($siswa->keranjang()->firstOrCreate()->total())->toBe(2000);
});

it('siswa yang sudah login tidak bisa buka halaman masuk lagi', function () {
    actingSiswa();

    $this->get(route('siswa.masuk'))->assertRedirect(route('keranjang'));
    $this->get(route('siswa.daftar'))->assertRedirect(route('keranjang'));
});

it('sinkron keranjang memotong jumlah ke stok server', function () {
    $produk = Product::factory()->create(['stok' => 2, 'harga' => 1000]);
    actingSiswa();

    // Browser minta 9 pcs dan ngirim harga sendiri: keduanya diabaikan.
    $response = $this->postJson(route('keranjang.sinkron'), [
        'cart' => [['id' => $produk->id, 'nama' => 'Palsu', 'harga' => 1, 'jumlah' => 9]],
    ])->assertOk();

    $isi = $response->json('cart');

    expect($isi)->toHaveCount(1)
        ->and($isi[0]['jumlah'])->toBe(2)
        ->and($isi[0]['harga'])->toBe(1000);
});

it('sinkron keranjang butuh login', function () {
    $this->postJson(route('keranjang.sinkron'), ['cart' => []])
        ->assertUnauthorized();
});

it('keranjang siswa A tidak bisa ditulis lewat sinkron siswa B', function () {
    $produk = Product::factory()->create(['stok' => 5]);
    $budi = siswa();
    $siti = siswa();

    isiKeranjang($budi, [['id' => $produk->id, 'jumlah' => 3]]);

    // Siti login dan kirim keranjang kosong: ini hanya boleh mengosongkan
    // keranjang Siti, bukan keranjang Budi.
    $this->actingAs($siti, 'siswa')
        ->postJson(route('keranjang.sinkron'), ['cart' => []])
        ->assertOk();

    expect($budi->keranjang()->firstOrCreate()->isi())->toHaveCount(1)
        ->and($siti->keranjang()->firstOrCreate()->isi())->toBeEmpty();
});

it('order lama tanpa siswa_id tidak muncul di riwayat siapa pun', function () {
    // Order sebelum fitur akun tidak punya pemilik. Nilainya tetap dihitung
    // sebagai pendapatan, tapi tidak boleh muncul sebagai milik seseorang.
    Order::factory()->tanpaPemilik()->create(['nama' => 'Tanpa Akun']);

    actingSiswa();

    $this->get(route('pesanan.index'))
        ->assertOk()
        ->assertDontSee('Tanpa Akun');
});
