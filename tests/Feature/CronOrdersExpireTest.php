<?php

use App\Models\Order;
use Illuminate\Support\Facades\Config;

it('menolak panggilan cron tanpa token yang benar', function () {
    Config::set('services.cron.secret', 'rahasia-cron');

    $this->get('/cron/orders-expire')->assertForbidden();
    $this->get('/cron/orders-expire', ['Authorization' => 'Bearer salah'])->assertForbidden();
});

it('menjalankan pembersihan pesanan kedaluwarsa saat token cocok', function () {
    Config::set('services.cron.secret', 'rahasia-cron');

    $lewat = Order::factory()->menungguBayar()->create(['batas_bayar' => now()->subMinute()]);

    $this->get('/cron/orders-expire', ['Authorization' => 'Bearer rahasia-cron'])->assertOk();

    expect(Order::find($lewat->id))->toBeNull();
});

it('mematikan endpoint cron selama token belum diset', function () {
    Config::set('services.cron.secret', '');

    $this->get('/cron/orders-expire', ['Authorization' => 'Bearer apa-saja'])->assertForbidden();
});
