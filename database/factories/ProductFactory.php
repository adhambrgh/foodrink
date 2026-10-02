<?php

namespace Database\Factories;

use App\Enums\Kategori;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nama = fake()->unique()->words(3, true);

        return [
            'nama' => ucfirst($nama),
            'deskripsi' => fake()->sentence(8),
            'harga' => fake()->numberBetween(5, 50) * 1000,
            'stok' => fake()->numberBetween(0, 50),
            'kategori' => fake()->randomElement(Kategori::cases()),
            'tersedia' => true,
            'urutan' => fake()->numberBetween(0, 10),
        ];
    }

    public function habis(): static
    {
        return $this->state(fn () => ['stok' => 0]);
    }
}
