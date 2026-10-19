<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | This option controls the default mailer that is used to send all email
    | messages unless another mailer is explicitly specified when sending
    | the message. All additional mailers can be configured within the
    | "mailers" array. Examples of each type of mailer are provided.
    |
    */

    'default' => env('MAIL_MAILER', 'log'), // Mailer default pengiriman email

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the mailers used by your application plus
    | their respective settings. Several examples have been configured for
    | you and you are free to add your own as your application requires.
    |
    | Laravel supports a variety of mail "transport" drivers that can be used
    | when delivering an email. You may specify which one you're using for
    | your mailers below. You may also add additional mailers if needed.
    |
    | Supported: "smtp", "sendmail", "mailgun", "ses", "ses-v2",
    |            "postmark", "resend", "log", "array",
    |            "failover", "roundrobin"
    |
    */

    'mailers' => [

        'smtp' => [ // Mailer SMTP standar
            'transport' => 'smtp', // Jenis transport SMTP
            'scheme' => env('MAIL_SCHEME'), // Skema enkripsi (tls/ssl)
            'url' => env('MAIL_URL'), // URL DSN mailer
            'host' => env('MAIL_HOST', '127.0.0.1'), // Host server SMTP
            'port' => env('MAIL_PORT', 2525), // Port server SMTP
            'username' => env('MAIL_USERNAME'), // Username SMTP
            'password' => env('MAIL_PASSWORD'), // Password SMTP
            'timeout' => null, // Batas waktu koneksi
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST)), // Domain EHLO
        ],

        'ses' => [ // Mailer Amazon SES
            'transport' => 'ses', // Jenis transport SES
        ],

        'postmark' => [ // Mailer Postmark
            'transport' => 'postmark', // Jenis transport Postmark
            // 'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
            // 'client' => [
            //     'timeout' => 5,
            // ],
        ],

        'resend' => [ // Mailer Resend API
            'transport' => 'resend', // Jenis transport Resend
        ],

        'sendmail' => [ // Mailer sendmail lokal
            'transport' => 'sendmail', // Jenis transport sendmail
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'), // Path binary sendmail
        ],

        'log' => [ // Mailer tulis ke log
            'transport' => 'log', // Jenis transport log
            'channel' => env('MAIL_LOG_CHANNEL'), // Channel log tujuan
        ],

        'array' => [ // Mailer simpan di array (testing)
            'transport' => 'array', // Jenis transport array
        ],

        'failover' => [ // Mailer failover berurutan
            'transport' => 'failover', // Jenis transport failover
            'mailers' => [ // Daftar mailer cadangan
                'smtp', // Coba SMTP dulu
                'log', // Fallback ke log
            ],
        ],

        'roundrobin' => [ // Mailer giliran round-robin
            'transport' => 'roundrobin', // Jenis transport roundrobin
            'mailers' => [ // Daftar mailer bergantian
                'ses', // Mailer SES
                'postmark', // Mailer Postmark
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | You may wish for all emails sent by your application to be sent from
    | the same address. Here you may specify a name and address that is
    | used globally for all emails that are sent by your application.
    |
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'), // Alamat pengirim global
        'name' => env('MAIL_FROM_NAME', 'Example'), // Nama pengirim global
    ],

];
