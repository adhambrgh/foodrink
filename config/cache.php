<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Cache Store
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache store that will be used by the
    | framework. This connection is utilized if another isn't explicitly
    | specified when running a cache operation inside the application.
    |
    */

    'default' => env('CACHE_STORE', 'database'), // Driver cache default aplikasi

    /*
    |--------------------------------------------------------------------------
    | Cache Stores
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the cache "stores" for your application as
    | well as their drivers. You may even define multiple stores for the
    | same cache driver to group types of items stored in your caches.
    |
    | Supported drivers: "array", "database", "file", "memcached",
    |                    "redis", "dynamodb", "octane", "null"
    |
    */

    'stores' => [

        'array' => [ // Cache di memori (testing)
            'driver' => 'array', // Driver cache array
            'serialize' => false, // Tanpa serialisasi data
        ],

        'database' => [ // Cache di database
            'driver' => 'database', // Driver cache database
            'connection' => env('DB_CACHE_CONNECTION'), // Koneksi DB khusus cache
            'table' => env('DB_CACHE_TABLE', 'cache'), // Tabel penyimpanan cache
            'lock_connection' => env('DB_CACHE_LOCK_CONNECTION'), // Koneksi DB untuk lock
            'lock_table' => env('DB_CACHE_LOCK_TABLE'), // Tabel penyimpanan lock cache
        ],

        'file' => [ // Cache di file lokal
            'driver' => 'file', // Driver cache file
            'path' => storage_path('framework/cache/data'), // Path folder file cache
            'lock_path' => storage_path('framework/cache/data'), // Path folder file lock
        ],

        'memcached' => [ // Cache memakai Memcached server
            'driver' => 'memcached', // Driver cache memcached
            'persistent_id' => env('MEMCACHED_PERSISTENT_ID'), // ID koneksi persistent
            'sasl' => [
                env('MEMCACHED_USERNAME'), // Username otentikasi SASL
                env('MEMCACHED_PASSWORD'), // Password otentikasi SASL
            ],
            'options' => [
                // Memcached::OPT_CONNECT_TIMEOUT => 2000,
            ],
            'servers' => [
                [
                    'host' => env('MEMCACHED_HOST', '127.0.0.1'), // Host server memcached
                    'port' => env('MEMCACHED_PORT', 11211), // Port server memcached
                    'weight' => 100, // Bobot node server
                ],
            ],
        ],

        'redis' => [ // Cache memakai Redis
            'driver' => 'redis', // Driver cache redis
            'connection' => env('REDIS_CACHE_CONNECTION', 'cache'), // Konfigurasi koneksi redis
            'lock_connection' => env('REDIS_CACHE_LOCK_CONNECTION', 'default'), // Koneksi lock redis
        ],

        'dynamodb' => [ // Cache AWS DynamoDB
            'driver' => 'dynamodb', // Driver cache dynamodb
            'key' => env('AWS_ACCESS_KEY_ID'), // AWS access key
            'secret' => env('AWS_SECRET_ACCESS_KEY'), // AWS secret key
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'), // Wilayah AWS
            'table' => env('DYNAMODB_CACHE_TABLE', 'cache'), // Tabel DynamoDB
            'endpoint' => env('DYNAMODB_ENDPOINT'), // Endpoint custom AWS
        ],

        'octane' => [ // Cache untuk Laravel Octane
            'driver' => 'octane', // Driver memori Octane
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Key Prefix
    |--------------------------------------------------------------------------
    |
    | When utilizing the APC, database, memcached, Redis, and DynamoDB cache
    | stores, there might be other applications using the same cache. For
    | that reason, you may prefix every cache key to avoid collisions.
    |
    */

    'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache_'), // Awalan key cache unik

];
