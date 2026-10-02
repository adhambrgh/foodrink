<?php

namespace Database\Factories;

use App\Models\Siswa;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Siswa>
 */
class SiswaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // NIS sekolah biasanya angka panjang; dipakai string supaya
            // nol di depan tidak hilang.
            'nis' => (string) fake()->unique()->numberBetween(10_000_000, 99_999_999),
            'nama' => fake()->name(),
            'tingkat' => null,
            'jurusan' => null,
            'kode_kelas' => null,
            'ruang' => null,
            'password' => 'rahasia123',
            'remember_token' => Str::random(10),
        ];
    }

    public function sudahPunyaKelas(): static
    {
        return $this->state(fn () => [
            'tingkat' => fake()->randomElement(\App\Enums\TingkatKelas::cases()),
            'jurusan' => fake()->randomElement(\App\Enums\Jurusan::cases()),
            'kode_kelas' => fake()->randomElement(\App\Enums\KodeKelas::cases()),
            'ruang' => 'Ruang '.fake()->numberBetween(1, 30),
        ]);
    }
}
