<?php

use App\Models\Order;

it('menghapus pesanan belum bayar yang sudah lewat batas bayar', function () {
    $lewat = Order::factory()->menungguBayar()->create(['batas_bayar' => now()->subMinute()]);

    $this->artisan('orders:expire')->assertSuccessful();

    expect(Order::find($lewat->id))->toBeNull();
});

it('tidak menghapus pesanan yang masih menunggu dalam batas atau sudah dibayar', function () {
    $masihAdaWaktu = Order::factory()->menungguBayar()->create(['batas_bayar' => now()->addMinutes(30)]);
    $lunas = Order::factory()->lunas()->create();

    $this->artisan('orders:expire')->assertSuccessful();

    expect(Order::find($masihAdaWaktu->id))->not->toBeNull();
    expect(Order::find($lunas->id))->not->toBeNull();
});
