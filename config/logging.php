<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    |
    | This option defines the default log channel that is utilized to write
    | messages to your logs. The value provided here should match one of
    | the channels present in the list of "channels" configured below.
    |
    */

    'default' => env('LOG_CHANNEL', 'stack'), // Channel log default aplikasi

    /*
    |--------------------------------------------------------------------------
    | Deprecations Log Channel
    |--------------------------------------------------------------------------
    |
    | This option controls the log channel that should be used to log warnings
    | regarding deprecated PHP and library features. This allows you to get
    | your application ready for upcoming major versions of dependencies.
    |
    */

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'), // Channel log deprecations
        'trace' => env('LOG_DEPRECATIONS_TRACE', false), // Sertakan trace deprecations
    ],

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    |
    | Here you may configure the log channels for your application. Laravel
    | utilizes the Monolog PHP logging library, which includes a variety
    | of powerful log handlers and formatters that you're free to use.
    |
    | Available drivers: "single", "daily", "slack", "syslog",
    |                    "errorlog", "monolog", "custom", "stack"
    |
    */

    'channels' => [

        'stack' => [ // Gabungan multi-channel log
            'driver' => 'stack', // Driver log stack
            'channels' => explode(',', env('LOG_STACK', 'single')), // Daftar channel tujuan
            'ignore_exceptions' => false, // Abaikan exception saat logging
        ],

        'single' => [ // Log ke file tunggal
            'driver' => 'single', // Driver file tunggal
            'path' => storage_path('logs/laravel.log'), // Lokasi file log
            'level' => env('LOG_LEVEL', 'debug'), // Level log minimal
            'replace_placeholders' => true, // Ganti placeholder context
        ],

        'daily' => [ // Log berganti harian
            'driver' => 'daily', // Driver log harian
            'path' => storage_path('logs/laravel.log'), // Lokasi file log
            'level' => env('LOG_LEVEL', 'debug'), // Level log minimal
            'days' => env('LOG_DAILY_DAYS', 14), // Simpan log N hari
            'replace_placeholders' => true, // Ganti placeholder context
        ],

        'slack' => [ // Kirim log ke webhook Slack
            'driver' => 'slack', // Driver notifikasi Slack
            'url' => env('LOG_SLACK_WEBHOOK_URL'), // URL webhook Slack
            'username' => env('LOG_SLACK_USERNAME', 'Laravel Log'), // Nama pengirim di Slack
            'emoji' => env('LOG_SLACK_EMOJI', ':boom:'), // Emoji bot Slack
            'level' => env('LOG_LEVEL', 'critical'), // Level minimal kirim Slack
            'replace_placeholders' => true, // Ganti placeholder context
        ],

        'papertrail' => [ // Kirim log ke layanan Papertrail
            'driver' => 'monolog', // Driver kustom Monolog
            'level' => env('LOG_LEVEL', 'debug'), // Level log minimal
            'handler' => env('LOG_PAPERTRAIL_HANDLER', SyslogUdpHandler::class), // Monolog handler Papertrail
            'handler_with' => [ // Opsi handler Papertrail
                'host' => env('PAPERTRAIL_URL'), // Host Papertrail
                'port' => env('PAPERTRAIL_PORT'), // Port Papertrail
                'connectionString' => 'tls://'.env('PAPERTRAIL_URL').':'.env('PAPERTRAIL_PORT'), // String koneksi TLS
            ],
            'processors' => [PsrLogMessageProcessor::class], // Processor format log
        ],

        'stderr' => [ // Output log ke standar error
            'driver' => 'monolog', // Driver kustom Monolog
            'level' => env('LOG_LEVEL', 'debug'), // Level log minimal
            'handler' => StreamHandler::class, // Handler stream Monolog
            'formatter' => env('LOG_STDERR_FORMATTER'), // Format teks log
            'with' => [
                'stream' => 'php://stderr', // Stream output stderr
            ],
            'processors' => [PsrLogMessageProcessor::class], // Processor format log
        ],

        'syslog' => [ // Simpan log ke syslog OS
            'driver' => 'syslog', // Driver syslog sistem
            'level' => env('LOG_LEVEL', 'debug'), // Level log minimal
            'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER), // Fasilitas logging sistem
            'replace_placeholders' => true, // Ganti placeholder context
        ],

        'errorlog' => [ // Simpan log via PHP error_log
            'driver' => 'errorlog', // Driver error_log PHP
            'level' => env('LOG_LEVEL', 'debug'), // Level log minimal
            'replace_placeholders' => true, // Ganti placeholder context
        ],

        'null' => [ // Nonaktifkan logging (dibuang)
            'driver' => 'monolog', // Driver Monolog
            'handler' => NullHandler::class, // Handler tanpa aksi
        ],

        'emergency' => [ // Log darurat saat logger gagal
            'path' => storage_path('logs/laravel.log'), // Path fallback darurat
        ],

    ],

];
