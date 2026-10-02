<?php

use App\Enums\KodeKelas;
use App\Enums\Jurusan;
use App\Enums\StatusOrder;
use App\Enums\TingkatKelas;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

/*
 * After checkout ada tiga tempat yang harus konsisten: struk buat pembeli,
 * daftar pesanan buat petugas, dan catatan status yang boleh dipindah.
 * Uji di sini karena ketiganya berbagi tabel yang sama -- kalau satu
 * lupa diperbarui, pembeli dan petugas jadi lihat cerita yang beda.
 */

function petugasPesanan(): User
{
    return User::factory()->create();
}

it('pesanan yang dibayar langsung muncul di daftar admin', function () {
    $order = Order::factory()->create([
        'nama' => 'Rina',
        'status' => StatusOrder::Lunas,
        'tingkat' => TingkatKelas::Sepuluh,
        'jurusan' => Jurusan::Rpl,
        'kode_kelas' => KodeKelas::A,
        'ruang' => 'Ruang 204',
    ]);
    $order->items()->create([
        'product_id' => Product::factory()->create()->id,
        'nama' => 'Pisang Nugget Coklat Keju',
        'harga' => 10_000,
        'jumlah' => 2,
        'subtotal' => 20_000,
    ]);

    $this->actingAs(petugasPesanan())
        ->get(route('admin.pesanan.index'))
        ->assertOk()
        ->assertSee($order->kode)
        ->assertSee('Rina')
        ->assertSee('X ')
        ->assertSee('Ruang 204')
        ->assertSee('Sedang diproses');
});

it('pesanan yang belum dibayar atau dibatalkan tidak muncul di daftar admin', function () {
    // Pembeli yang membayar lalu membatalkan popup: tidak ada uang yang
    // masuk, jadi tidak boleh jadi pekerjaan petugas.
    $menunggu = Order::factory()->menungguBayar()->create(['nama' => 'Rina']);
    $batal = Order::factory()->batal()->create(['nama' => 'Budi']);
    $lunas = Order::factory()->lunas()->create(['nama' => 'Sinta']);

    $petugas = $this->actingAs(petugasPesanan());

    $petugas->get(route('admin.pesanan.index'))
        ->assertOk()
        ->assertSee($lunas->kode)
        ->assertDontSee($menunggu->kode)
        ->assertDontSee($batal->kode);

    // Saringan status tidak bisa jadi pintu masuk untuk status tersembunyi.
    $petugas->get(route('admin.pesanan.index', ['status' => 'MenungguBayar']))
        ->assertOk()
        ->assertDontSee($menunggu->kode);

    $petugas->get(route('admin.pesanan.index', ['status' => 'Batal']))
        ->assertOk()
        ->assertDontSee($batal->kode);
});

it('daftar admin bisa disaring status dan dicari', function () {
    $lunas = Order::factory()->lunas()->create(['nama' => 'Rina']);
    $selesai = Order::factory()->selesai()->create(['nama' => 'Budi']);

    $petugas = $this->actingAs(petugasPesanan());

    $petugas->get(route('admin.pesanan.index', ['status' => 'Lunas']))
        ->assertOk()
        ->assertSee($lunas->kode)
        ->assertDontSee($selesai->kode);

    $petugas->get(route('admin.pesanan.index', ['q' => 'Budi']))
        ->assertOk()
        ->assertSee($selesai->kode)
        ->assertDontSee($lunas->kode);

    // Status ngawur tidak boleh bikin 500.
    $petugas->get(route('admin.pesanan.index', ['status' => 'ngawur']))->assertOk();
});

it('petugas bisa menandai pesanan selesai langsung dari diproses', function () {
    $order = Order::factory()->lunas()->create();

    $this->actingAs(petugasPesanan())
        ->from(route('admin.pesanan.index'))
        ->patch(route('admin.pesanan.status', $order), ['status' => StatusOrder::Selesai->value])
        ->assertRedirect(route('admin.pesanan.index'))
        ->assertSessionHas('sukses');

    expect($order->fresh()->status)->toBe(StatusOrder::Selesai);
});

it('perpindahan status yang tidak dibolehkan ditolak', function () {
    $order = Order::factory()->selesai()->create();

    $this->actingAs(petugasPesanan())
        ->from(route('admin.pesanan.index'))
        // Selesai adalah status akhir: tidak bisa dikembalikan ke diproses.
        ->patch(route('admin.pesanan.status', $order), ['status' => StatusOrder::Lunas->value])
        ->assertSessionHas('galat');

    expect($order->fresh()->status)->toBe(StatusOrder::Selesai);
});

it('daftar pesanan admin tidak terbuka untuk tamu', function () {
    $this->get(route('admin.pesanan.index'))
        ->assertRedirect(route('admin.login'));
});

it('pembeli bisa melihat riwayat dan struk pesanannya sendiri', function () {
    $saya = siswa();
    $orangLain = siswa();

    $orderSaya = Order::factory()->create([
        'siswa_id' => $saya->id,
        'nama' => 'Rina',
        'ruang' => 'Ruang 204',
    ]);
    $orderOrangLain = Order::factory()->create([
        'siswa_id' => $orangLain->id,
        'nama' => 'Budi',
    ]);

    $this->actingAs($saya, 'siswa')
        ->get(route('pesanan.index'))
        ->assertOk()
        ->assertSee($orderSaya->kode)
        ->assertSee('Rina')
        // Pesanan siswa lain tidak boleh bocor ke halaman riwayat ini,
        // meskipun tidak ada session browser yang involved.
        ->assertDontSee($orderOrangLain->kode);

    $this->actingAs($saya, 'siswa')
        ->get(route('pesanan.show', $orderSaya->kode))
        ->assertOk()
        ->assertSee($orderSaya->kode)
        ->assertSee('Cetak struk');

    // Kode milik orang lain 404, bukan struk kosong.
    $this->actingAs($saya, 'siswa')
        ->get(route('pesanan.show', $orderOrangLain->kode))
        ->assertNotFound();
});

it('riwayat pesanan tetap ada di perangkat lain setelah login ulang', function () {
    $siswa = siswa();

    Order::factory()->create(['siswa_id' => $siswa->id, 'nama' => 'Rina']);

    // Cookie/session browser sengaja dibuang: yangpegang riwayat adalah
    // akun, bukan jejak browser.
    $this->flushSession();

    $this->actingAs($siswa, 'siswa')
        ->get(route('pesanan.index'))
        ->assertOk()
        ->assertSee('Rina');
});

it('pesanan selesai ikut dihitung sebagai pendapatan', function () {
    Order::factory()->selesai()->create(['total' => 15_000]);
    Order::factory()->batal()->create(['total' => 99_000]);

    $this->actingAs(petugasPesanan())
        ->get(route('admin.pendapatan'))
        ->assertOk()
        ->assertSee('15.000');
});
