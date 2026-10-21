<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'), // Token API Postmark
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'), // AWS access key SES
        'secret' => env('AWS_SECRET_ACCESS_KEY'), // AWS secret key SES
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'), // Wilayah AWS SES
    ],

    'resend' => [
        'key' => env('RESEND_KEY'), // Kunci API Resend
    ],

    'slack' => [
        'notifications' => [ // Konfigurasi notifikasi Slack bot
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'), // Token OAuth bot Slack
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'), // Channel tujuan default
        ],
    ],

    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'), // Kunci server Midtrans
        'client_key' => env('MIDTRANS_CLIENT_KEY'), // Kunci client Midtrans
        'is_production' => env('MIDTRANS_IS_PRODUCTION', false), // Penanda mode produksi
        'batas_bayar_menit' => (int) env('MIDTRANS_BATAS_BAYAR_MENIT', 30), // Batas bayar QRIS (menit)
    ],

    'cron' => [
        // Rahasia yang dikirim Vercel Cron lewat header Authorization.
        // Selama nilainya kosong, endpoint cron mati total.
        'secret' => env('CRON_SECRET'), // Token verifikasi cron
    ],

];
