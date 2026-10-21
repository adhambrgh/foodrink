<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Command inspire: tampilkan kutipan motivasi.
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Bersihkan order QRIS yang tak pernah dibayar. Jalan tiap 5 menit supaya
// daftar admin tidak menumpuk pesanan hantu.
Schedule::command('orders:expire')->everyFiveMinutes();
