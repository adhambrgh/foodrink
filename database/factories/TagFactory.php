<?php

namespace Database\Factories;

use App\Enums\WarnaTag;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tag>
 */
class TagFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => fake()->unique()->randomElement([
                'Paling laris',
                'Anak kelas suka',
                'Buat berdua',
                'Musiman',
                'Baru',
                'Bisa dicampur',
            ]),
            'warna' => fake()->randomElement(WarnaTag::cases()),
            'tampil_katalog' => true,
            'sorot' => false,
            'urutan' => fake()->numberBetween(0, 10),
        ];
    }

    public function sorot(): static
    {
        return $this->state(fn () => ['sorot' => true]);
    }

    public function hanyaAdmin(): static
    {
        return $this->state(fn () => ['tampil_katalog' => false]);
    }
}
