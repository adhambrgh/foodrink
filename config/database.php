<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | the connection which will be utilized unless another connection
    | is explicitly specified when you execute a query / statement.
    |
    */

    'default' => env('DB_CONNECTION', 'sqlite'), // Koneksi database default dipakai

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Below are all of the database connections defined for your application.
    | An example configuration is provided for each database system which
    | is supported by Laravel. You're free to add / remove connections.
    |
    */

    'connections' => [

        'sqlite' => [ // Koneksi SQLite (file lokal)
            'driver' => 'sqlite', // Driver SQLite
            'url' => env('DB_URL'), // URL koneksi lengkap
            'database' => env('DB_DATABASE', database_path('database.sqlite')), // Path file database
            'prefix' => '', // Awalan nama tabel
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true), // Aktifkan foreign key
            'busy_timeout' => null, // Waktu tunggu DB sibuk (ms)
            'journal_mode' => null, // Mode journal SQLite
            'synchronous' => null, // Mode sinkronisasi SQLite
        ],

        'mysql' => [ // Koneksi MySQL
            'driver' => 'mysql', // Driver MySQL
            'url' => env('DB_URL'), // URL koneksi lengkap
            'host' => env('DB_HOST', '127.0.0.1'), // Host database
            'port' => env('DB_PORT', '3306'), // Port database
            'database' => env('DB_DATABASE', 'laravel'), // Nama database
            'username' => env('DB_USERNAME', 'root'), // Username database
            'password' => env('DB_PASSWORD', ''), // Password database
            'unix_socket' => env('DB_SOCKET', ''), // Socket Unix (opsional)
            'charset' => env('DB_CHARSET', 'utf8mb4'), // Charset koneksi
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'), // Kolasi default
            'prefix' => '', // Awalan nama tabel
            'prefix_indexes' => true, // Awali indeks dengan prefix
            'strict' => true, // Mode strict MySQL
            'engine' => null, // Storage engine tabel
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'), // CA SSL MySQL
            ]) : [],
        ],

        'mariadb' => [ // Koneksi MariaDB
            'driver' => 'mariadb', // Driver MariaDB
            'url' => env('DB_URL'), // URL koneksi lengkap
            'host' => env('DB_HOST', '127.0.0.1'), // Host database
            'port' => env('DB_PORT', '3306'), // Port database
            'database' => env('DB_DATABASE', 'laravel'), // Nama database
            'username' => env('DB_USERNAME', 'root'), // Username database
            'password' => env('DB_PASSWORD', ''), // Password database
            'unix_socket' => env('DB_SOCKET', ''), // Socket Unix (opsional)
            'charset' => env('DB_CHARSET', 'utf8mb4'), // Charset koneksi
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'), // Kolasi default
            'prefix' => '', // Awalan nama tabel
            'prefix_indexes' => true, // Awali indeks dengan prefix
            'strict' => true, // Mode strict MariaDB
            'engine' => null, // Storage engine tabel
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'), // CA SSL MariaDB
            ]) : [],
        ],

        'pgsql' => [ // Koneksi PostgreSQL
            'driver' => 'pgsql', // Driver PostgreSQL
            'url' => env('DB_URL'), // URL koneksi lengkap
            'host' => env('DB_HOST', '127.0.0.1'), // Host database
            'port' => env('DB_PORT', '5432'), // Port database
            'database' => env('DB_DATABASE', 'laravel'), // Nama database
            'username' => env('DB_USERNAME', 'root'), // Username database
            'password' => env('DB_PASSWORD', ''), // Password database
            'charset' => env('DB_CHARSET', 'utf8'), // Charset koneksi
            'prefix' => '', // Awalan nama tabel
            'prefix_indexes' => true, // Awali indeks dengan prefix
            'search_path' => 'public', // Skema default PostgreSQL
            'sslmode' => env('DB_SSLMODE', 'require'), // Mode SSL PostgreSQL
        ],

        'sqlsrv' => [ // Koneksi SQL Server
            'driver' => 'sqlsrv', // Driver SQL Server
            'url' => env('DB_URL'), // URL koneksi lengkap
            'host' => env('DB_HOST', 'localhost'), // Host database
            'port' => env('DB_PORT', '1433'), // Port database
            'database' => env('DB_DATABASE', 'laravel'), // Nama database
            'username' => env('DB_USERNAME', 'root'), // Username database
            'password' => env('DB_PASSWORD', ''), // Password database
            'charset' => env('DB_CHARSET', 'utf8'), // Charset koneksi
            'prefix' => '', // Awalan nama tabel
            'prefix_indexes' => true, // Awali indeks dengan prefix
            // 'encrypt' => env('DB_ENCRYPT', 'yes'),
            // 'trust_server_certificate' => env('DB_TRUST_SERVER_CERTIFICATE', 'false'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run on the database.
    |
    */

    'migrations' => [
        'table' => 'migrations', // Tabel riwayat migration
        'update_date_on_publish' => true, // Update tanggal saat publish
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as Memcached. You may define your connection settings here.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'), // Library PHP untuk Redis

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'), // Mode cluster Redis
            'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'), // Awalan key Redis
            'persistent' => env('REDIS_PERSISTENT', false), // Koneksi persisten
        ],

        'default' => [ // Koneksi Redis default
            'url' => env('REDIS_URL'), // URL koneksi lengkap
            'host' => env('REDIS_HOST', '127.0.0.1'), // Host Redis
            'username' => env('REDIS_USERNAME'), // Username Redis
            'password' => env('REDIS_PASSWORD'), // Password Redis
            'port' => env('REDIS_PORT', '6379'), // Port Redis
            'database' => env('REDIS_DB', '0'), // Nomor database Redis
        ],

        'cache' => [ // Koneksi Redis khusus cache
            'url' => env('REDIS_URL'), // URL koneksi lengkap
            'host' => env('REDIS_HOST', '127.0.0.1'), // Host Redis
            'username' => env('REDIS_USERNAME'), // Username Redis
            'password' => env('REDIS_PASSWORD'), // Password Redis
            'port' => env('REDIS_PORT', '6379'), // Port Redis
            'database' => env('REDIS_CACHE_DB', '1'), // Database Redis untuk cache
        ],

    ],

];
