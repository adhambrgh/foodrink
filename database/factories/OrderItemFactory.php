<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $harga = fake()->numberBetween(3_000, 15_000);
        $jumlah = fake()->numberBetween(1, 3);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'nama' => fake()->randomElement([
                'Pisang Nugget Coklat Keju',
                'Es Mamboo Mangga',
                'Roti Bakar Cokelat',
                'Kentang Goreng',
            ]),
            'harga' => $harga,
            'jumlah' => $jumlah,
            'subtotal' => $harga * $jumlah,
        ];
    }
}
