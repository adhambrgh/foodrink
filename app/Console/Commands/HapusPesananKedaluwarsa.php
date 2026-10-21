<?php

namespace App\Console\Commands;

use App\Enums\StatusOrder;
use App\Models\Order;
use Illuminate\Console\Command;

/**
 * Bersihkan order QRIS yang tak pernah dibayar sampai batas waktunya.
 *
 * Order seperti ini tidak pernah jadi uang masuk, jadi tidak ada jejak yang
 * perlu disimpan -- order_items ikut terhapus lewat cascade. Ini melanjutkan
 * keputusan migrasi `sederhanakan_status_pesanan` yang memang menghapus
 * pesanan kedaluwarsa, bukan memberi status baru.
 */
class HapusPesananKedaluwarsa extends Command
{
    protected $signature = 'orders:expire'; // nama perintah artisan

    protected $description = 'Hapus pesanan QRIS yang belum dibayar sampai batas bayar'; // deskripsi perintah

    public function handle(): int // jalankan pembersihan
    {
        $jumlah = Order::query() // mulai query order
            ->where('status', StatusOrder::MenungguBayar->value) // hanya yang belum dibayar
            ->whereNotNull('batas_bayar') // yang punya batas
            ->where('batas_bayar', '<', now()) // sudah lewat batas
            ->delete(); // hapus (order_items ikut cascade)

        $this->info("Pesanan kedaluwarsa dihapus: {$jumlah}"); // laporkan jumlah

        return self::SUCCESS; // tandai sukses
    }
}
