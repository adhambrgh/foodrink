<?php

$sandbox = ! env('MIDTRANS_PRODUCTION', false); // Mode sandbox jika bukan production

return [

    /*
    |--------------------------------------------------------------------------
    | Kredensial
    |--------------------------------------------------------------------------
    |
    | Diisi dari Midtrans Merchant Administration Portal. Kosongkan keduanya
    | untuk menjalankan mode simulasi lokal (token dummy, tanpa panggilan API).
    |
    */

    'server_key' => env('MIDTRANS_SERVER_KEY'), // Kunci rahasia server Midtrans

    'client_key' => env('MIDTRANS_CLIENT_KEY'), // Kunci publik Snap JS

    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    */

    'production' => ! $sandbox, // True jika mode produksi

    /*
    |--------------------------------------------------------------------------
    | Endpoint
    |--------------------------------------------------------------------------
    |
    | Base URL disimpan terpisah karena beberapa endpoint butuh order id di
    | dalam path-nya, dan itu ditambahkan di MidtransClient saat request --
    | bukan di file config.
    |
    */

    'snap_token_url' => $sandbox // URL ambil token transaksi Snap
        ? 'https://app.sandbox.midtrans.com/snap/v2/transactions'
        : 'https://app.midtrans.com/snap/v2/transactions',

    'api_base_url' => $sandbox // Base URL API Midtrans
        ? 'https://api.sandbox.midtrans.com/v2'
        : 'https://api.midtrans.com/v2',

    'snap_js_url' => $sandbox // URL script Snap JS
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'
        : 'https://app.midtrans.com/snap/snap.js',

    /*
    |--------------------------------------------------------------------------
    | Verifikasi webhook
    |--------------------------------------------------------------------------
    |
    | Kalau key webhook terpisah sudah diset di dashboard Midtrans, pakai itu.
    | Kalau tidak, jatuh ke server key.
    |
    */

    'webhook_hash_key' => env('MIDTRANS_WEBHOOK_HASH_KEY', env('MIDTRANS_SERVER_KEY')), // Kunci verifikasi webhook

    /*
    |--------------------------------------------------------------------------
    | Batas bayar
    |--------------------------------------------------------------------------
    |
    | Order QRIS yang belum dibayar setelah selang ini ditandai kedaluwarsa.
    |
    */

    'batas_bayar_menit' => (int) env('MIDTRANS_BATAS_BAYAR_MENIT', 15), // Batas bayar (menit) sebelum order QRIS kedaluwarsa

];
