<?php

use App\Models\Siswa;
use App\Models\User;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option defines the default authentication "guard" and password
    | reset "broker" for your application. You may change these values
    | as required, but they're a perfect start for most applications.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'), // Guard default = admin
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'), // Broker reset password default
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | which utilizes session storage plus the Eloquent user provider.
    |
    | All authentication guards have a user provider, which defines how the
    | users are actually retrieved out of your database or other storage
    | system used by the application. Typically, Eloquent is utilized.
    |
    | Supported: "session"
    |
    */

    'guards' => [
        'web' => [ // Guard admin pakai session
            'driver' => 'session', // Simpan login di session
            'provider' => 'users', // Ambil data dari provider users
        ],

        // Guard terpisah untuk siswa. Sengaja tidak memakai `web`:
        // `web` berarti admin di aplikasi ini, dan keduanya harus tidak
        // bisa saling menggantikan session.
        'siswa' => [ // Guard siswa terpisah dari admin
            'driver' => 'session', // Simpan login di session
            'provider' => 'siswa', // Ambil data dari provider siswa
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication guards have a user provider, which defines how the
    | users are actually retrieved out of your database or other storage
    | system used by the application. Typically, Eloquent is utilized.
    |
    | If you have multiple user tables or models you may configure multiple
    | providers to represent the model / table. These providers may then
    | be assigned to any extra authentication guards you have defined.
    |
    | Supported: "database", "eloquent"
    |
    */

    'providers' => [
        'users' => [ // Provider akun admin/bawaan
            'driver' => 'eloquent', // Pakai Eloquent ORM
            'model' => env('AUTH_MODEL', User::class), // Model akun admin
        ],

        'siswa' => [ // Provider akun siswa
            'driver' => 'eloquent', // Pakai Eloquent ORM
            'model' => env('AUTH_MODEL_SISWA', Siswa::class), // Model akun siswa
        ],

        // 'users' => [
        //     'driver' => 'database',
        //     'table' => 'users',
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | These configuration options specify the behavior of Laravel's password
    | reset functionality, including the table utilized for token storage
    | and the user provider that is invoked to actually retrieve users.
    |
    | The expiry time is the number of minutes that each reset token will be
    | considered valid. This security feature keeps tokens short-lived so
    | they have less time to be guessed. You may change this as needed.
    |
    | The throttle setting is the number of seconds a user must wait before
    | generating more password reset tokens. This prevents the user from
    | quickly generating a very large amount of password reset tokens.
    |
    */

    'passwords' => [
        'users' => [ // Broker reset password akun
            'provider' => 'users', // Pakai provider users
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'), // Tabel simpan token reset
            'expire' => 60, // Token valid 60 menit
            'throttle' => 60, // Jeda kirim ulang 60 detik
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the amount of seconds before a password confirmation
    | window expires and users are asked to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800), // Batas konfirmasi ulang password (detik)

];
