<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Satu akun admin. Kredensial default diambil dari .env supaya bisa
     * diganti tanpa menyentuh kode.
     *
     * Password di-cast 'hashed' oleh model User, jadi di sini diisi polos.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@foodrink.test');
        $password = env('ADMIN_PASSWORD', 'rahasia123');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin Foodrink',
                'password' => $password,
                'email_verified_at' => now(),
            ]
        );

        $this->command?->info("Admin siap: {$email}");
    }
}
