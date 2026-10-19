<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'), // Disk default penyimpanan file

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [ // Disk lokal privat
            'driver' => 'local', // Driver filesystem lokal
            'root' => storage_path('app/private'), // Folder akar penyimpanan
            'serve' => true, // Izinkan serve file via route
            'throw' => false, // Lempar exception saat gagal
            'report' => false, // Laporkan error ke logger
        ],

        'public' => [ // Disk publik (diakses via URL)
            'driver' => 'local', // Driver filesystem lokal
            'root' => storage_path('app/public'), // Folder akar publik
            'url' => env('APP_URL').'/storage', // URL akses publik
            'visibility' => 'public', // Izin akses publik
            'throw' => false, // Lempar exception saat gagal
            'report' => false, // Laporkan error ke logger
        ],

        's3' => [ // Disk AWS S3
            'driver' => 's3', // Driver AWS S3
            'key' => env('AWS_ACCESS_KEY_ID'), // AWS access key
            'secret' => env('AWS_SECRET_ACCESS_KEY'), // AWS secret key
            'region' => env('AWS_DEFAULT_REGION'), // Wilayah AWS
            'bucket' => env('AWS_BUCKET'), // Nama bucket S3
            'url' => env('AWS_URL'), // URL bucket custom
            'endpoint' => env('AWS_ENDPOINT'), // Endpoint custom S3
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false), // Pakai path-style URL
            'throw' => false, // Lempar exception saat gagal
            'report' => false, // Laporkan error ke logger
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'), // Symlink: public/storage -> storage/app/public
    ],

];
