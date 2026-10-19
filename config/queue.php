<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Queue Connection Name
    |--------------------------------------------------------------------------
    |
    | Laravel's queue supports a variety of backends via a single, unified
    | API, giving you convenient access to each backend using identical
    | syntax for each. The default queue connection is defined below.
    |
    */

    'default' => env('QUEUE_CONNECTION', 'database'), // Backend antrean default

    /*
    |--------------------------------------------------------------------------
    | Queue Connections
    |--------------------------------------------------------------------------
    |
    | Here you may configure the connection options for every queue backend
    | used by your application. An example configuration is provided for
    | each backend supported by Laravel. You're also free to add more.
    |
    | Drivers: "sync", "database", "beanstalkd", "sqs", "redis", "null"
    |
    */

    'connections' => [

        'sync' => [ // Antrean sinkron (langsung)
            'driver' => 'sync', // Driver eksekusi langsung
        ],

        'database' => [ // Antrean di database
            'driver' => 'database', // Driver antrean database
            'connection' => env('DB_QUEUE_CONNECTION'), // Koneksi DB antrean
            'table' => env('DB_QUEUE_TABLE', 'jobs'), // Tabel job antrean
            'queue' => env('DB_QUEUE', 'default'), // Nama queue default
            'retry_after' => (int) env('DB_QUEUE_RETRY_AFTER', 90), // Jeda retry job (detik)
            'after_commit' => false, // Dispatch setelah commit transaksi
        ],

        'beanstalkd' => [ // Antrean via Beanstalkd
            'driver' => 'beanstalkd', // Driver Beanstalkd
            'host' => env('BEANSTALKD_QUEUE_HOST', 'localhost'), // Host Beanstalkd
            'queue' => env('BEANSTALKD_QUEUE', 'default'), // Nama queue
            'retry_after' => (int) env('BEANSTALKD_QUEUE_RETRY_AFTER', 90), // Jeda retry job (detik)
            'block_for' => 0, // Lama blocking ambil job (detik)
            'after_commit' => false, // Dispatch setelah commit transaksi
        ],

        'sqs' => [ // Antrean AWS SQS
            'driver' => 'sqs', // Driver Amazon SQS
            'key' => env('AWS_ACCESS_KEY_ID'), // AWS access key
            'secret' => env('AWS_SECRET_ACCESS_KEY'), // AWS secret key
            'prefix' => env('SQS_PREFIX', 'https://sqs.us-east-1.amazonaws.com/your-account-id'), // Prefix URL SQS
            'queue' => env('SQS_QUEUE', 'default'), // Nama queue SQS
            'suffix' => env('SQS_SUFFIX'), // Suffix nama queue
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'), // Wilayah AWS
            'after_commit' => false, // Dispatch setelah commit transaksi
        ],

        'redis' => [ // Antrean via Redis
            'driver' => 'redis', // Driver antrean Redis
            'connection' => env('REDIS_QUEUE_CONNECTION', 'default'), // Koneksi Redis
            'queue' => env('REDIS_QUEUE', 'default'), // Nama queue Redis
            'retry_after' => (int) env('REDIS_QUEUE_RETRY_AFTER', 90), // Jeda retry job (detik)
            'block_for' => null, // Lama blocking ambil job (detik)
            'after_commit' => false, // Dispatch setelah commit transaksi
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Job Batching
    |--------------------------------------------------------------------------
    |
    | The following options configure the database and table that store job
    | batching information. These options can be updated to any database
    | connection and table which has been defined by your application.
    |
    */

    'batching' => [
        'database' => env('DB_CONNECTION', 'sqlite'), // Koneksi DB batch job
        'table' => 'job_batches', // Tabel penyimpanan batch job
    ],

    /*
    |--------------------------------------------------------------------------
    | Failed Queue Jobs
    |--------------------------------------------------------------------------
    |
    | These options configure the behavior of failed queue job logging so you
    | can control how and where failed jobs are stored. Laravel ships with
    | support for storing failed jobs in a simple file or in a database.
    |
    | Supported drivers: "database-uuids", "dynamodb", "file", "null"
    |
    */

    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'), // Driver simpan job gagal
        'database' => env('DB_CONNECTION', 'sqlite'), // Koneksi DB job gagal
        'table' => 'failed_jobs', // Tabel job gagal
    ],

];
