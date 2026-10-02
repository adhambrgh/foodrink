<?php

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\StatusOrder;
use App\Enums\TingkatKelas;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Support\KodePesanan;
use Illuminate\Support\Facades\Http;

/*
 * Pendapatan bulanan hanya boleh menghitung uang yang benar-benar masuk.
 * Sumbernya jadi dua: pesanan dicatat saat checkout dan ditandai lunas
 * dari callback/finish, lalu dashboard admin menjumlahkannya per bulan.
 */

function petugas(): User
{
    return User::factory()->create();
}

/** Nama bulan Bahasa Indonesia, sama seperti yang dipakai controller. */
function bulanIni(): string
{
    $nama = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    return $nama[(int) now()->month].' '.now()->format('Y');
}

function buatOrderTerbayar(string $bulan, int $total, string $nama = 'Dina'): Order
{
    $order = Order::factory()->padaBulan($bulan)->create([
        'nama' => $nama,
        'total' => $total,
    ]);

    OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => Product::factory(),
        'nama' => 'Pisang Nugget Coklat Keju',
        'harga' => $total,
        'jumlah' => 1,
        'subtotal' => $total,
    ]);

    return $order;
}

it('halaman pendapatan hanya terbuka untuk admin yang login', function () {
    $this->get(route('admin.pendapatan'))->assertRedirect(route('admin.login'));

    $this->actingAs(petugas())
        ->get(route('admin.pendapatan'))
        ->assertOk();
});

it('pendapatan bulanan menjumlahkan pesanan lunas saja', function () {
    buatOrderTerbayar(now()->format('Y-m'), 15_000);
    buatOrderTerbayar(now()->format('Y-m'), 25_000);
    Order::factory()->padaBulan(now()->format('Y-m'))->menungguBayar()->create(['total' => 90_000]);
    Order::factory()->padaBulan(now()->format('Y-m'))->batal()->create(['total' => 70_000]);

    $riwayat = Order::pendapatanPerBulan(12);

    expect($riwayat)->toHaveCount(1)
        ->and((int) $riwayat->first()->total)->toBe(40_000)
        ->and((int) $riwayat->first()->transaksi)->toBe(2);
});

it('pendapatan tunai baru dihitung setelah pesanan selesai', function () {
    // Uang tunai masuk saat petugas mengantar dan menerima pembayaran,
    // bukan saat pesanan dibuat. Jadi order yang masih diproses tidak boleh
    // bikin angka dashboard lebih besar dari uang yang benar-benar diterima.
    Order::factory()->padaBulan(now()->format('Y-m'))->tunaiDiproses()->create(['total' => 50_000]);

    $sebelum = Order::pendapatanPerBulan(12);
    expect($sebelum)->toHaveCount(0);

    Order::factory()->padaBulan(now()->format('Y-m'))->tunaiSelesai()->create(['total' => 50_000]);
    buatOrderTerbayar(now()->format('Y-m'), 10_000);

    $sesudah = Order::pendapatanPerBulan(12)->first();
    expect((int) $sesudah->total)->toBe(60_000)
        ->and((int) $sesudah->transaksi)->toBe(2);
});

it('riwayat bulanan hanya mencakup 12 bulan terakhir', function () {
    buatOrderTerbayar(now()->format('Y-m'), 15_000);
    buatOrderTerbayar(now()->subMonth()->format('Y-m'), 33_000);
    Order::factory()->lunas()->create([
        'total' => 77_000,
        'created_at' => now()->subMonths(13),
    ]);

    $riwayat = Order::pendapatanPerBulan(12)->keyBy('bulan');

    expect($riwayat->keys()->all())->toContain(now()->format('Y-m'))
        ->and((int) $riwayat[now()->format('Y-m')]->total)->toBe(15_000)
        ->and((int) $riwayat[now()->subMonth()->format('Y-m')]->total)->toBe(33_000)
        ->and($riwayat->has(now()->subMonths(13)->format('Y-m')))->toBeFalse();
});

it('dashboard menampilkan total, rincian, dan produk terlaris', function () {
    buatOrderTerbayar(now()->format('Y-m'), 15_000, 'Rina');
    buatOrderTerbayar(now()->format('Y-m'), 20_000, 'Bayu');
    buatOrderTerbayar(now()->subMonths(2)->format('Y-m'), 99_000, 'Orang Bulan Lalu');

    $this->actingAs(petugas())
        ->get(route('admin.pendapatan'))
        ->assertOk()
        ->assertSee('Pendapatan '.bulanIni())
        ->assertSee('Rp 35.000')
        ->assertSee('Rina')
        ->assertSee('Bayu')
        // Pesanan bulan lain tidak ikut masuk rincian bulan ini.
        ->assertDontSee('Orang Bulan Lalu');
});

it('bulan lain bisa dipilih lewat query string dan bulan rusak diabaikan', function () {
    buatOrderTerbayar(now()->subMonth()->format('Y-m'), 42_000, 'Sari');

    $this->actingAs(petugas())
        ->get(route('admin.pendapatan', ['bulan' => now()->subMonth()->format('Y-m')]))
        ->assertOk()
        ->assertSee('Sari')
        ->assertSee('Rp 42.000');

    $this->actingAs(petugas())
        ->get(route('admin.pendapatan', ['bulan' => 'bukan-bulan']))
        ->assertOk();
});

it('checkout mencatat pesanan beserta rinciannya', function () {
    $produk = Product::factory()->create(['harga' => 11_000, 'stok' => 5]);

    Http::fake([
        'api.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-abc'], 201),
    ]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 2]]);

    $response = $this->withSession([
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
            'ruang' => 'Ruang 204',
        ],
    ])->get(route('checkout.index'));

    $response->assertOk();

    $order = Order::latest('id')->first();

    expect($order)->not->toBeNull()
        ->and($order->status)->toBe(StatusOrder::MenungguBayar)
        ->and($order->total)->toBe(22_000)
        ->and($order->nama)->toBe('Rina')
        // Order harus terikat ke akun yang memesan, bukan cuma ke browser.
        ->and($order->siswa_id)->toBe($siswa->id)
        ->and($order->tingkat)->toBe(TingkatKelas::Sepuluh)
        ->and($order->jurusan)->toBe(Jurusan::Rpl)
        ->and($order->kode_kelas)->toBe(KodeKelas::A)
        ->and($order->kelas_lengkap)->toBe('X RPL A')
        ->and($order->ruang)->toBe('Ruang 204')
        ->and($order->tujuan_label)->toBe('X RPL A · Ruang 204')
        ->and($order->midtrans_order_id)->not->toBeEmpty()
        ->and($order->kode)->toStartWith('FR-')
        ->and($order->items)->toHaveCount(1)
        ->and($order->items->first()->nama)->toBe($produk->nama)
        ->and($order->items->first()->subtotal)->toBe(22_000);
});

it('checkout yang gagal terhubung ke Midtrans tidak meninggalkan pesanan', function () {
    $produk = Product::factory()->create(['harga' => 11_000, 'stok' => 5]);

    // Tanpa token Snap tidak ada transaksi di Midtrans, jadi order-nya juga
    // tidak perlu disimpan -- pembeli diarahkan balik ke keranjang.
    Http::fake([
        'api.sandbox.midtrans.com/*' => Http::response(['status_code' => '401'], 200),
    ]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 2]]);

    $this->withSession([
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
            'ruang' => 'Ruang 204',
        ],
    ])->get(route('checkout.index'))
        ->assertRedirect(route('keranjang'))
        ->assertSessionHas('galat');

    expect(Order::count())->toBe(0)
        ->and(OrderItem::count())->toBe(0)
        ->and($produk->fresh()->stok)->toBe(5)
        // Keranjang dikosongkan supaya siswa bisa langsung memilih lagi.
        ->and($siswa->keranjang()->firstOrCreate()->isi())->toBeEmpty();
});

it('checkout tunai langsung jadi pesanan tanpa menyentuh Midtrans', function () {
    $produk = Product::factory()->create(['harga' => 11_000, 'stok' => 5]);

    // Kalau tunai masih memanggil Midtrans, test ini akan gagal karena
    // fake-nya sengaja dibuat meledak.
    Http::fake(function () {
        throw new RuntimeException('tidak boleh memanggil Midtrans untuk order tunai');
    });

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 2]]);

    $this->withSession([
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
            'ruang' => 'Ruang 204',
        ],
        'cara_bayar' => Order::BAYAR_TUNAI,
    ])->get(route('checkout.index'))
        ->assertOk()
        ->assertSee('Pesanan sudah masuk')
        ->assertDontSee('snap.js');

    $order = Order::latest('id')->first();

    expect($order->metode_bayar)->toBe(Order::BAYAR_TUNAI)
        ->and($order->status)->toBe(StatusOrder::Lunas)
        ->and($order->siswa_id)->toBe($siswa->id)
        ->and($order->snap_token)->toBeNull()
        ->and($order->batas_bayar)->toBeNull()
        ->and($order->caraBayarLabel())->toBe('Tunai')
        // Stok dipotong sekarang: pesanannya sudah pasti dibuat, jadi
        // jajannya harus diamankan dari pembeli lain.
        ->and($produk->fresh()->stok)->toBe(3);
});

it('checkout non tunai tetap lewat Midtrans dan nunggu konfirmasi', function () {
    $produk = Product::factory()->create(['harga' => 10_000, 'stok' => 5]);

    Http::fake([
        'api.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-abc'], 201),
    ]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 1]]);

    $this->withSession([
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
            'ruang' => 'Ruang 204',
        ],
        'cara_bayar' => Order::BAYAR_QRIS,
    ])->get(route('checkout.index'))->assertOk();

    $order = Order::latest('id')->first();

    expect($order->metode_bayar)->toBe(Order::BAYAR_QRIS)
        ->and($order->status)->toBe(StatusOrder::MenungguBayar)
        ->and($order->siswa_id)->toBe($siswa->id)
        ->and($order->snap_token)->toBe('snap-token-abc')
        // Struk menampilkan "QRIS", bukan "Non tunai": yang dipindai pembeli
    // adalah QRIS-nya, jadi struk dan catatan vendor harus sama.
    ->and($order->caraBayarLabel())->toBe('QRIS')
        ->and($produk->fresh()->stok)->toBe(5);
});

it('prepare menolak metode bayar yang tidak dikenal', function () {
    $produk = Product::factory()->create(['harga' => 10_000, 'stok' => 5]);

    actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'nama' => $produk->nama, 'harga' => 10_000, 'jumlah' => 1]],
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
            'ruang' => 'Ruang 204',
        ],
        'cara_bayar' => 'transfer-bank',
    ])->assertStatus(422);

    expect(Order::count())->toBe(0);
});

it('checkout menampilkan halaman bayar dengan token Snap', function () {
    $produk = Product::factory()->create(['harga' => 10_000, 'stok' => 5]);

    Http::fake([
        'api.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-abc'], 200),
    ]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 1]]);

    $this->withSession([
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => 'X',
            'jurusan' => 'RPL',
            'kode_kelas' => 'A',
            'ruang' => 'Ruang 204',
        ],
    ])->get(route('checkout.index'))
        ->assertOk()
        ->assertSee('Bayar dulu ya')
        ->assertSee('snap-token-abc', false)
        ->assertSee('app.sandbox.midtrans.com/snap/snap.js', false)
        // Popup-nya ditunda sampai tombol ditekan, bukan muncul sendiri
        // begitu halaman kebuka.
        ->assertSee('buka-pembayaran', false)
        ->assertSee("addEventListener('click', buka)", false);

    expect(Order::latest('id')->first())
        ->not->toBeNull()
        ->and(Order::latest('id')->first()->snap_token)->toBe('snap-token-abc');
});

it('checkout tanpa data penerima dikembalikan ke keranjang', function () {
    $produk = Product::factory()->create(['stok' => 5]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 1]]);

    // Tidak ada session penerima sama sekali: pembeli membuka /checkout
    // langsung tanpa lewat prepare.
    $this->get(route('checkout.index'))
        ->assertRedirect(route('keranjang'))
        ->assertSessionHas('galat');

    // Tidak boleh ada order nyasar tanpa tujuan antar.
    expect(Order::count())->toBe(0);
});

/**
 * Panggil endpoint callback seperti yang akan dilakukan server Midtrans:
 * tanpa sesi siswa, hanya dengan signature_key yang benar.
 *
 * @return array<string, string>
 */
function callbackLunas(Order $order, array $ubah = []): array
{
    config(['services.midtrans.server_key' => 'kunci-uji']);

    $payload = array_merge([
        'order_id' => $order->midtrans_order_id,
        'status_code' => '200',
        'gross_amount' => (string) $order->total,
        'transaction_status' => 'settlement',
        'fraud_status' => 'accept',
    ], $ubah);

    // Signature hanya dihitung kalau test tidak menyuruhnya dipalsukan.
    $payload += [
        'signature_key' => hash(
            'sha512',
            $payload['order_id'].$payload['status_code'].$payload['gross_amount'].config('services.midtrans.server_key')
        ),
    ];

    return $payload;
}

it('callback pembayaran mengosongkan keranjang pemiliknya tanpa butuh sesi login', function () {
    // Callback datang dari server Midtrans, jadi tidak ada yang login.
    // Kalau pengosongan keranjang masih membaca $request->user() di sini,
    // proses ini akan fatal karena user() selalu null.
    $produk = Product::factory()->create(['harga' => 10_000, 'stok' => 5]);

    $siswa = actingSiswa();
    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 2]]);

    $order = Order::factory()->create([
        'status' => StatusOrder::MenungguBayar,
        'siswa_id' => $siswa->id,
        'total' => 20_000,
    ]);

    $this->post(route('checkout.callback'), callbackLunas($order))
        ->assertOk()
        ->assertSee('OK');

    expect($order->fresh()->status)->toBe(StatusOrder::Lunas)
        ->and($siswa->keranjang()->firstOrCreate()->isi())->toBeEmpty();
});

it('callback pembayaran tidak menyentuh keranjang siswa lain', function () {
    $produk = Product::factory()->create(['stok' => 5]);

    $pembeli = actingSiswa();
    $pemirip = siswa();

    isiKeranjang($pembeli, [['id' => $produk->id, 'jumlah' => 2]]);
    isiKeranjang($pemirip, [['id' => $produk->id, 'jumlah' => 1]]);

    $order = Order::factory()->create([
        'status' => StatusOrder::MenungguBayar,
        'siswa_id' => $pembeli->id,
        'total' => 20_000,
    ]);

    $this->post(route('checkout.callback'), callbackLunas($order))->assertOk();

    expect($pembeli->keranjang()->firstOrCreate()->isi())->toBeEmpty()
        // Keranjang pemirip harus utuh; ini yang_error kalau pembersihan
        // dilakukan tanpa memfilter pemilik order.
        ->and($pemirip->keranjang()->firstOrCreate()->isi())->toHaveCount(1);
});

it('callback ganda tidak memotong stok dua kali', function () {
    $produk = Product::factory()->create(['stok' => 5]);

    $siswa = actingSiswa();
    $order = Order::factory()->create([
        'status' => StatusOrder::MenungguBayar,
        'siswa_id' => $siswa->id,
        'total' => 20_000,
    ]);
    $order->items()->create([
        'product_id' => $produk->id,
        'nama' => $produk->nama,
        'harga' => 10_000,
        'jumlah' => 2,
        'subtotal' => 20_000,
    ]);

    // Midtrans memang bisa mengirim callback lebih dari sekali.
    $this->post(route('checkout.callback'), callbackLunas($order))->assertOk();
    $this->post(route('checkout.callback'), callbackLunas($order))->assertOk();

    expect($produk->fresh()->stok)->toBe(3);
});

it('callback dengan signature salah tidak mengubah apa pun', function () {
    $produk = Product::factory()->create(['stok' => 5]);

    $siswa = actingSiswa();
    $order = Order::factory()->create([
        'status' => StatusOrder::MenungguBayar,
        'siswa_id' => $siswa->id,
        'total' => 20_000,
    ]);
    $order->items()->create([
        'product_id' => $produk->id,
        'nama' => $produk->nama,
        'harga' => 10_000,
        'jumlah' => 2,
        'subtotal' => 20_000,
    ]);

    isiKeranjang($siswa, [['id' => $produk->id, 'jumlah' => 2]]);

    $this->post(route('checkout.callback'), callbackLunas($order, ['signature_key' => 'dipalsukan']))
        ->assertStatus(400);

    expect($order->fresh()->status)->toBe(StatusOrder::MenungguBayar)
        ->and($produk->fresh()->stok)->toBe(5)
        ->and($siswa->keranjang()->firstOrCreate()->isi())->toHaveCount(1);
});

it('setelah bayar muncul struk pesanan', function () {
    // APP_ENV saat test bukan local, jadi verifikasi ke Midtrans wajib
    // di-fake. Kalau tidak, statusnya tidak akan pernah jadi lunas.
    config(['services.midtrans.server_key' => 'kunci-uji']);
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ], 200),
    ]);

    $produk = Product::factory()->create(['harga' => 10_000, 'stok' => 5]);

    $siswa = actingSiswa();

    $order = Order::factory()->create([
        'status' => StatusOrder::MenungguBayar,
        'siswa_id' => $siswa->id,
        'nama' => 'Rina',
        'tingkat' => TingkatKelas::Sepuluh,
        'jurusan' => Jurusan::Rpl,
        'kode_kelas' => KodeKelas::A,
        'ruang' => 'Ruang 204',
        'total' => 20_000,
    ]);
    $order->items()->create([
        'product_id' => $produk->id,
        'nama' => $produk->nama,
        'harga' => 10_000,
        'jumlah' => 2,
        'subtotal' => 20_000,
    ]);

    $this->get(route('checkout.finish', ['order_id' => $order->midtrans_order_id, 'status' => 'success']))
        ->assertOk()
        ->assertSee($order->kode)
        ->assertSee('X RPL A')
        ->assertSee('Ruang 204')
        ->assertSee('Cetak struk')
        ->assertSee('Sedang diproses');

    expect($order->fresh()->status)->toBe(StatusOrder::Lunas)
        ->and($produk->fresh()->stok)->toBe(3);
});

it('pesanan yang dibatalkan pembayaran tetap punya struk', function () {
    config(['services.midtrans.server_key' => 'kunci-uji']);
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'pending',
        ], 200),
    ]);

    $siswa = actingSiswa();
    $order = Order::factory()->create([
        'status' => StatusOrder::MenungguBayar,
        'siswa_id' => $siswa->id,
        'total' => 12_000,
    ]);

    $this->get(route('checkout.unfinish', ['order_id' => $order->midtrans_order_id]))
        ->assertOk()
        ->assertSee('Pembayaran dibatalkan')
        ->assertSee($order->kode);

    expect($order->fresh()->status)->toBe(StatusOrder::MenungguBayar);
});

it('pesanan orang lain tidak bisa dibuka lewat kode struk', function () {
    // Order Budi tetap milik Budi, sedangkan yang sedang login adalah Rina.
    // Menebak kodenya tidak cukup: ownership dicek dari akun, bukan dari
    // session browser.
    $order = Order::factory()->create(['nama' => 'Budi']);

    actingSiswa(['nama' => 'Rina']);

    $this->get(route('pesanan.show', $order->kode))->assertNotFound();
});

it('keranjang dan halaman pesanan menolak tamu yang belum login', function () {
    $this->get(route('keranjang'))->assertRedirect(route('siswa.masuk'));
    $this->get(route('checkout.index'))->assertRedirect(route('siswa.masuk'));
    $this->get(route('pesanan.index'))->assertRedirect(route('siswa.masuk'));
});

it('halaman katalog tetap terbuka untuk tamu', function () {
    $this->get(route('katalog'))->assertOk();
});

/*
 * Data penerima: nama orang + nama ruangan tujuan antar. Ini yang dipakai
 * admin untuk mengantar, jadi server harus menolak kalau tidak lengkap --
 * tidak cukup hanya andalkan cek di browser.
 */

it('prepare menyimpan nama, kelas, dan ruangan ke session', function () {
    $produk = Product::factory()->create(['stok' => 10, 'harga' => 10_000]);

    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 2]],
        'penerima' => [
            'nama' => 'rina',
            'tingkat' => 'X',
            'jurusan' => 'RPL',
            'kode_kelas' => 'A',
            'ruang' => 'ruang 204',
        ],
    ])->assertOk();

    $keranjang = $siswa->keranjang()->firstOrCreate()->isi();

    expect(session('penerima'))->toBe([
        'nama' => 'Rina',
        'tingkat' => 'X',
        'jurusan' => 'RPL',
        'kode_kelas' => 'A',
        // Huruf besar biar enak dibaca admin di daftar antrean.
        'ruang' => 'RUANG 204',
    ])->and($keranjang[0]['harga'])->toBe(10_000)
        ->and($keranjang[0]['jumlah'])->toBe(2);
});

it('data penerima wajib lengkap sebelum lanjut ke pembayaran', function (string $field, mixed $nilai) {
    $produk = Product::factory()->create(['stok' => 10]);

    actingSiswa();

    $lengkap = [
        'nama' => 'Rina',
        'ruang' => 'Ruang 204',
        'tingkat' => TingkatKelas::Sepuluh->value,
        'jurusan' => Jurusan::Rpl->value,
        'kode_kelas' => KodeKelas::A->value,
    ];

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => [...$lengkap, $field => $nilai],
        'cara_bayar' => Order::BAYAR_TUNAI,
    ])->assertStatus(422)->assertJsonValidationErrors("penerima.$field");
})->with([
    ['nama', ''],
    ['ruang', ''],
    ['tingkat', ''],
    ['jurusan', ''],
    ['kode_kelas', ''],
    // Spasi saja harus dianggap kosong, bukan isian sah.
    ['nama', '   '],
    ['ruang', '  '],
    // Select yang tidak dipilih juga mengirim string kosong, bukan null.
    ['tingkat', null],
]);

it('pesan penolakan menyebut nama field, bukan kunci teknis', function () {
    $produk = Product::factory()->create(['stok' => 10]);

    actingSiswa();

    // Label dari validasiPenerima membuat pembeli membaca
    // "Nama penerima wajib diisi", bukan "penerima.nama".
$response = $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => [
            'nama' => '',
            'ruang' => 'Ruang 204',
            'tingkat' => '',
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
        ],
        'cara_bayar' => Order::BAYAR_TUNAI,
    ])->assertStatus(422);

    // Label dari validasiPenerima mengganti nama teknis field: pembeli
    // dan petugas membaca "nama penerima", bukan "penerima.nama".
    // (Pesan intinya masih bahasa Inggris karena locale aplikasi "en";
    // yang tampil ke pembeli sehari-hari tetap pesan JS berbahasa Indonesia.)
    $errors = $response->json('errors');

    expect($errors)->toHaveKeys(['penerima.nama', 'penerima.tingkat'])
        ->and($errors['penerima.nama'][0])->toContain('nama penerima')
        ->and($errors['penerima.nama'][0])->not->toContain('penerima.nama')
        ->and($errors['penerima.tingkat'][0])->toContain('tingkat kelas');
});


it('penerima yang lolos validasi ikut tersimpan di pesanan', function () {
    $produk = Product::factory()->create(['stok' => 10, 'harga' => 10_000]);

    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => [
            'nama' => 'Rina',
            'ruang' => 'Ruang 204',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
        ],
        'cara_bayar' => Order::BAYAR_TUNAI,
    ])->assertOk();

    $this->get(route('checkout.index'))->assertOk();

    $order = Order::latest('id')->first();

    expect($order->nama)->toBe('Rina')
        ->and($order->ruang)->toBe('RUANG 204')
        ->and($order->kelas_lengkap)->toBe('X RPL A')
        ->and($order->bayarTunai())->toBeTrue()
        ->and($order->status)->toBe(StatusOrder::Lunas);
});

it('tingkat, jurusan, dan kode di luar daftar ditolak', function () {
    $produk = Product::factory()->create(['stok' => 10]);

    actingSiswa();

    $kirim = function (array $penerima) use ($produk) {
        return $this->postJson(route('checkout.prepare'), [
            'cart' => [['id' => $produk->id, 'jumlah' => 1]],
            'penerima' => $penerima,
        ]);
    };

    $kirim([
        'nama' => 'Rina',
        'tingkat' => 'IX',
        'jurusan' => 'RPL',
        'kode_kelas' => 'A',
    ])->assertStatus(422)->assertJsonValidationErrors('penerima.tingkat');

    // Jurusan harus salah satu dari 8 jurusan sekolah ini. "IPA" bukan
    // salah satunya, jadi jangan sampai lolos hanya karena mirip inisial.
    $kirim([
        'nama' => 'Rina',
        'tingkat' => 'X',
        'jurusan' => 'IPA',
        'kode_kelas' => 'A',
    ])->assertStatus(422)->assertJsonValidationErrors('penerima.jurusan');

    // Kode kelas harus huruf A-H, bukan "Z" atau angka.
    $kirim([
        'nama' => 'Rina',
        'tingkat' => 'X',
        'jurusan' => 'RPL',
        'kode_kelas' => 'Z',
    ])->assertStatus(422)->assertJsonValidationErrors('penerima.kode_kelas');
});

it('nama ruangan wajib diisi dan dibatasi 60 karakter', function () {
    $produk = Product::factory()->create(['stok' => 10]);

    actingSiswa();

    $dasar = [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'cara_bayar' => Order::BAYAR_TUNAI,
        'penerima' => [
            'nama' => 'Rina',
            'ruang' => 'Ruang 204',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
        ],
    ];

    // Tidak diisi harus ditolak, karena tanpa ruangan petsugas tidak tahu
    // antar ke mana.
    $this->postJson(route('checkout.prepare'), [
        ...$dasar,
        'penerima' => [...$dasar['penerima'], 'ruang' => ''],
    ])->assertStatus(422)->assertJsonValidationErrors('penerima.ruang');

    $this->postJson(route('checkout.prepare'), [
        ...$dasar,
        'penerima' => [...$dasar['penerima'], 'ruang' => str_repeat('A', 61)],
    ])->assertStatus(422)->assertJsonValidationErrors('penerima.ruang');

    // Tepat 60 karakter masih diterima.
    $this->postJson(route('checkout.prepare'), [
        ...$dasar,
        'penerima' => [...$dasar['penerima'], 'ruang' => str_repeat('A', 60)],
    ])->assertOk();
});

it('prepare menolak kalau semua jajan di keranjang sudah habis', function () {
    $habis = Product::factory()->create(['stok' => 0]);
    $jugaHabis = Product::factory()->create(['stok' => 0]);

    $siswa = actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [
            ['id' => $habis->id, 'jumlah' => 1],
            ['id' => $jugaHabis->id, 'jumlah' => 2],
        ],
        'penerima' => [
            'nama' => 'Rina',
            'tingkat' => 'X',
            'jurusan' => 'RPL',
            'kode_kelas' => 'A',
        ],
    ])->assertStatus(422)->assertJson(['error' => 'Stok habis']);

    expect($siswa->keranjang)->toBeNull()
        ->and(session('cart'))->toBeNull();
});

it('keranjang menandai semua isian penerima sebagai wajib', function () {
    Product::factory()->create(['stok' => 10]);

    actingSiswa();

    $this->get(route('keranjang'))
        ->assertOk()
        ->assertSee('Nama penerima')
        ->assertSee('Nama ruangan')
        ->assertSee('Pilih tingkat')
        ->assertSee('Pilih jurusan')
        ->assertSee('X (10)')
        ->assertSee('XII (12)')
        ->assertSee('Rekayasa Perangkat Lunak')
        ->assertSeeHtml('value="H"')
        // Lima isian harus wajib, dan masing-masing punya tempat untuk
        // pesan error sendiri -- bukan satu pesan di bawah form.
        ->assertSeeHtml('id="nama-penerima"')
        ->assertSeeHtml('required')
        // Slot pesan harus lahir dalam keadaan tersembunyi: validasi baru
        // berjalan setelah tombol ditekan, jadi badge "!" tidak boleh
        // muncul sudah sejak halaman dibuka.
        ->assertSeeHtml('id="galat-nama-penerima" data-galat hidden')
        ->assertSeeHtml('id="galat-kode-kelas" data-galat hidden')
        ->assertSee('Semua diisi dulu ya, biar jajanmu nggak nyasar.', false)
        // Dua cara bayar jadi keputusan wajib berikutnya di halaman ini.
        ->assertSee('Bayar pakai')
        ->assertSee('Non tunai')
        ->assertSee('Tunai')
        ->assertSeeHtml('name="cara_bayar"')
        ->assertSeeHtml('value="tunai"');
});


it('struk pembayaran tunai menyebut tunai, bukan QRIS', function () {
    $produk = Product::factory()->create(['stok' => 10, 'harga' => 10_000]);

    actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => [
            'nama' => 'Rina',
            'ruang' => 'Ruang 204',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
        ],
        'cara_bayar' => Order::BAYAR_TUNAI,
    ])->assertOk();

    $this->get(route('checkout.index'))->assertOk();

    $order = Order::latest('id')->first();

    // Dulu field "Bayar" di struk ditulis hardcode jadi "QRIS", sehingga
    // struk pesanan tunai ikut berlabel QRIS dan menyesatkan petugas.
    $this->get(route('pesanan.show', $order->kode))
        ->assertOk()
        ->assertSee('<dd>Tunai</dd>', false)
        ->assertDontSee('<dd>QRIS</dd>', false)
        // Cash baru tagih saat antar, jadi nominalnya ikut disebut.
        ->assertSee('Petsugas ambil duit pas antar. Bayar Rp 10.000 ya.', false);
});

it('struk pembayaran non tunai menyebut QRIS', function () {
    Http::fake([
        '*transactions' => Http::response([
            'token' => 'snap-token-abc',
            'redirect_url' => 'https://app.midtrans.com/snap/v2/abc',
        ]),
    ]);

    $produk = Product::factory()->create(['stok' => 10, 'harga' => 10_000]);

    actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => [
            'nama' => 'Rina',
            'ruang' => 'Ruang 204',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
        ],
        'cara_bayar' => Order::BAYAR_QRIS,
    ])->assertOk();

    $this->get(route('checkout.index'))->assertOk();

    $order = Order::latest('id')->first();

    $this->get(route('pesanan.show', $order->kode))
        ->assertOk()
        ->assertSee('<dd>QRIS</dd>', false);
});

it('kode pesanan ditonjolkan di struk', function () {
    $produk = Product::factory()->create(['stok' => 10, 'harga' => 10_000]);

    actingSiswa();

    $this->postJson(route('checkout.prepare'), [
        'cart' => [['id' => $produk->id, 'jumlah' => 1]],
        'penerima' => [
            'nama' => 'Rina',
            'ruang' => 'Ruang 204',
            'tingkat' => TingkatKelas::Sepuluh->value,
            'jurusan' => Jurusan::Rpl->value,
            'kode_kelas' => KodeKelas::A->value,
        ],
        'cara_bayar' => Order::BAYAR_TUNAI,
    ])->assertOk();

    $this->get(route('checkout.index'))->assertOk();

    $order = Order::latest('id')->first();

    // Kode pets the only thing the vendor reads with their eyes, so it gets
    // its own boxed block rather than one cell in a metadata grid.
    $this->get(route('pesanan.show', $order->kode))
        ->assertOk()
        ->assertSee('struk__kode-box', false)
        ->assertSee($order->kode, false)
        ->assertSee('Ongkir antar ke kelas', false)
        ->assertSee('Gratis', false);
});

it('kode pesanan selalu unik walau nama produk sama', function () {
    $pertama = Order::factory()->create();
    $kedua = Order::factory()->create();

    expect($pertama->kode)->not->toBe($kedua->kode)
        ->and(KodePesanan::generate())->toStartWith('FR-');
});
