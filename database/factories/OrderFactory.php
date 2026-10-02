<?php

namespace Database\Factories;

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\StatusOrder;
use App\Enums\TingkatKelas;
use App\Models\Order;
use App\Models\Siswa;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $total = fake()->numberBetween(8_000, 48_000);

        return [
            'nama' => fake()->name(),
            'tingkat' => fake()->randomElement(TingkatKelas::cases()),
            'jurusan' => fake()->randomElement(Jurusan::cases()),
            'kode_kelas' => fake()->randomElement(KodeKelas::cases()),
            'ruang' => fake()->randomElement(['Ruang 204', 'Ruang 301', 'Lapangan', null]),
            'no_wa' => '62'.fake()->numerify('8##########'),
            'cara_ambil' => Order::CARA_AMBIL_ANTAR,
            'metode_bayar' => Order::BAYAR_QRIS,
            'status' => StatusOrder::Lunas,
            'total' => $total,
            'midtrans_order_id' => 'FOOD-'.Str::upper(Str::random(10)).'-'.fake()->unique()->numberBetween(1_000_000, 9_999_999),
            'batas_bayar' => now()->addMinutes(30), 
        ];
    }

    public function menungguBayar(): static
    {
        return $this->state(fn () => ['status' => StatusOrder::MenungguBayar]);
    }

    public function lunas(): static
    {
        return $this->state(fn () => ['status' => StatusOrder::Lunas]);
    }

    public function selesai(): static
    {
        return $this->state(fn () => ['status' => StatusOrder::Selesai]);
    }

    public function batal(): static
    {
        return $this->state(fn () => ['status' => StatusOrder::Batal]);
    }

    /** Pesanan tunai yang sudah dibuat tapi uangnya belum diterima. */
    public function tunaiDiproses(): static
    {
        return $this->state(fn () => [
            'metode_bayar' => Order::BAYAR_TUNAI,
            'status' => StatusOrder::Lunas,
            'snap_token' => null,
            'batas_bayar' => null,
        ]);
    }

    /** Pesanan tunai yang sudah diantar dan uangnya sudah diterima. */
    public function tunaiSelesai(): static
    {
        return $this->tunaiDiproses()->state(fn () => ['status' => StatusOrder::Selesai]);
    }

    public function padaBulan(string $bulan): static
    {
        return $this->state(fn () => [
            'created_at' => Carbon::createFromFormat('Y-m-d', $bulan.'-01')
                ->addDays(fake()->numberBetween(0, 20))
                ->addHours(9),
        ]);
    }

    /** Pesanan milik siswa tertentu. */
    public function milik(?Siswa $siswa = null): static
    {
        return $this->state(fn () => [
            'siswa_id' => ($siswa ?: Siswa::factory()->create())->id,
        ]);
    }

    /**
     * Pesanan tanpa pemilik, seperti yang dibuat sebelum fitur akun
     * siswa ada. Tetap utuh untuk laporan pendapatan, tapi tidak
     * terlihat di halaman pesanan siapa pun.
     */
    public function tanpaPemilik(): static
    {
        return $this->state(fn () => ['siswa_id' => null]);
    }
}
