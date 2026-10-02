<?php

namespace App\Http\Controllers;

use App\Enums\Jurusan;
use App\Enums\KodeKelas;
use App\Enums\StatusOrder;
use App\Enums\TingkatKelas;
use App\Models\Order;
use App\Models\Product;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Alur checkout pesanan: verifikasi keranjang, buat record Order,
 * integrasi Snap Midtrans (QRIS/VA) atau mode bayar Tunai saat antar,
 * serta menangani webhook callback dari server Midtrans.
 */
class CheckoutController extends Controller
{
    public function index(Request $request)
    {
        $cart = $this->keranjangSiswa($request);

        if (empty($cart)) {
            $this->kosongkanKeranjang($request);

            return redirect()->route('katalog')
                ->with('galat', 'Keranjang kosong, tidak bisa checkout.');
        }

        // Order harus selalu punya tujuan antar. Kalau session penerima
        // kosong, berarti pembeli membuka /checkout langsung tanpa lewat
        // prepare, jadi data penerima belum pernah tervalidasi.
        if (! session('penerima.nama') || ! session('penerima.ruang')) {
            $this->kosongkanKeranjang($request);

            return redirect()->route('keranjang')
                ->with('galat', 'Lengkapi data penerima dulu, baru bisa lanjut bayar.');
        }

        // Gratis antar ke kelas: total = subtotal, tanpa ongkir.
        $total = collect($cart)->sum(fn ($item) => $item['harga'] * $item['jumlah']);

        // Tunai: uangnya diterima petugas saat mengantar, jadi tidak ada
        // transaksi daring yang perlu dibuat. Order langsung masuk proses.
        if ($this->bayarTunai($request)) {
            $order = $this->buatOrder($request, $cart, $total, Order::BAYAR_TUNAI);
            $this->kurangiStok($order);
            $this->kosongkanKeranjang($request);

            return view('shop.checkout', [
                'cart' => $cart,
                'total' => $total,
                'order' => $order,
                'snapToken' => null,
                'snapUrl' => null,
                'clientKey' => null,
                'finishUrl' => null,
                'errorUrl' => null,
            ]);
        }

        // Pesanan dicatat lebih dulu supaya ada riwayatnya, walau pembeli
        // ternyata membatalkan pembayaran di popup Midtrans.
        $order = $this->buatOrder($request, $cart, $total);

        $snapToken = $this->createMidtransTransaction($order, $total);

        // Token gagal: transaksi di Midtrans tidak pernah ada, jadi order
        // ini juga tidak pernah berarti apa-apa. Dihapus, bukan ditandai
        // batal, supaya tidak jadi sampah di daftar.
        if (! $snapToken) {
            $order->delete();
            $this->kosongkanKeranjang($request);

            return redirect()->route('keranjang')
                ->with('galat', 'Gagal terhubung ke pembayaran Midtrans. Coba checkout lagi nanti.');
        }

        $order->update(['snap_token' => $snapToken]);

        return view('shop.checkout', [
            'cart' => $cart,
            'total' => $total,
            'order' => $order,
            'snapToken' => $snapToken,
            'snapUrl' => $this->snapUrl(),
            'clientKey' => config('services.midtrans.client_key'),
            'finishUrl' => route('checkout.finish'),
            'unfinishUrl' => route('checkout.unfinish'),
            'errorUrl' => route('checkout.error'),
        ]);
    }

    public function callback(Request $request)
    {
        $payload = $request->all();

        Log::info('Midtrans callback', $payload);

        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;

        $serverKey = config('services.midtrans.server_key');
        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        if ($signatureKey !== $expectedSignature) {
            Log::warning('Midtrans signature mismatch', [
                'expected' => $expectedSignature,
                'received' => $signatureKey,
            ]);

            return response('Invalid signature', 400);
        }

        $isSuccess = in_array($transactionStatus, ['capture', 'settlement'])
            && ($fraudStatus === 'accept' || $fraudStatus === null);

        if ($isSuccess) {
            // Callback datang dari server Midtrans, jadi tidak ada siswa yang
            // login di sini. Keranjang dikosongkan lewat pemilik order,
            // bukan lewat $request->user() yang pasti null.
            $order = $this->tandaiLunas($orderId);

            if ($order?->siswa_id) {
                Siswa::find($order->siswa_id)?->keranjang()->first()?->kosongkan();
            }

            Log::info("Order {$orderId} paid successfully");
        } else {
            Log::info("Order {$orderId} status: {$transactionStatus}, fraud: {$fraudStatus}");
        }

        return response('OK');
    }

    public function finish(Request $request)
    {
        $order = $this->cariOrder($request);

        // Halaman ini dibuka dari browser, jadi statusnya dicek ulang ke
        // Midtrans. Kalau server key tidak bisa dihubungi (mis. sedang
        // develops di lokal), query string dipercaya apa adanya --
        // produksi tetap wajib verifikasi lewat server.
        if ($order && $order->status === StatusOrder::MenungguBayar && $this->sudahTerbayar($order->midtrans_order_id)) {
            $this->tandaiLunas($order->midtrans_order_id);
            $order->refresh();
            $this->kosongkanKeranjang($request);
        }

        $status = $request->query('status');

        if (! $order) {
            return view('shop.checkout-finish', [
                'message' => 'Terima kasih telah berbelanja.',
                'orderId' => $request->query('order_id'),
            ]);
        }

        return view('shop.struk', [
            'order' => $order,
            'kepala' => match ($status) {
                'pending' => 'Pembayaran lagi dulu ya',
                default => $order->status === StatusOrder::MenungguBayar
                    ? 'Menunggu pembayaran'
                    : 'Pembayaran berhasil!',
            },
            'catatan' => match ($status) {
                'pending' => 'Uangmu belum masuk. Selesaikan pembayaran sebelum batas waktunya ya.',
                default => $order->status === StatusOrder::MenungguBayar
                    ? 'Kalau uangnya sudah keluar tapi statusnya masih nunggu, tunggu sebentar lalu refresh.'
                    : 'Simpan struk ini ya, biar gampang dicek sama petugas.',
            },
        ]);
    }

    public function unfinish(Request $request)
    {
        $order = $this->cariOrder($request);

        if (! $order) {
            return view('shop.checkout-finish', [
                'message' => 'Pembayaran dibatalkan. Kamu bisa checkout lagi kapan saja.',
                'orderId' => null,
            ]);
        }

        return view('shop.struk', [
            'order' => $order,
            'kepala' => 'Pembayaran dibatalkan',
            'catatan' => 'Pesanan ini belum dibayar, jadi belum kami proses. Kalau mau, checkout lagi ya.',
        ]);
    }

    public function error(Request $request)
    {
        $order = $this->cariOrder($request);

        if (! $order) {
            return view('shop.checkout-finish', [
                'message' => 'Terjadi kesalahan pada pembayaran. Silakan hubungi admin.',
                'orderId' => $request->query('order_id'),
            ]);
        }

        return view('shop.struk', [
            'order' => $order,
            'kepala' => 'Pembayaran gagal',
            'catatan' => 'Tidak bisa connect ke pembayaran. Coba lagi, atau hubungi petugas di kantin.',
        ]);
    }

    public function prepare(Request $request)
    {
        $cart = $request->json('cart', []);

        if (! is_array($cart) || $cart === []) {
            return response()->json([
                'error' => 'Cart empty',
                'pesan' => 'Keranjangmu kosong, jadi tidak bisa lanjut bayar.',
            ], 400);
        }

        $susun = $this->susunCart($cart);

        // Produk habis dibuang semua: tidak ada yang bisa dibeli, jadi
        // jangan sampai pengguna klik bayar.
        if (empty($susun)) {
            return response()->json([
                'error' => 'Stok habis',
                'pesan' => 'Semua jajan di keranjang sudah habis. Coba pilih yang lain.',
            ], 422);
        }

        $penerima = $this->validasiPenerima($request);
        $caraBayar = $this->validasiCaraBayar($request);

        // Persistensi keranjang pindah ke database supaya isi keranjang tidak
        // hilang saat ganti perangkat atau cookie dihapus.
        $keranjang = $request->user('siswa')->keranjang()->firstOrCreate();
        $keranjang->isiDengan($susun);

        $request->session()->put('penerima', $penerima);
        $request->session()->put('cara_bayar', $caraBayar);

        // Isi keranjang dikembalikan supaya browser bisa menandai
        // localStorage-nya sebagai milik akun. Tanpa ini, cache browser
        // tetap jadi sumber dan bisa menimpa keranjang akun di visits
        // berikutnya.
        return response()->json([
            'ok' => true,
            'cart' => $keranjang->isi(),
        ]);
    }

    /**
     * True kalau pesanan ini dibayar tunai, yaitu uang diterima petugas saat
     * mengantar. Nilai diambil dari session hasil validasi `prepare()`.
 */
private function bayarTunai(Request $request): bool
    {
        return $request->session()->get('cara_bayar') === Order::BAYAR_TUNAI;
    }

    /**
     * Cara bayar hanya boleh dua: tunai atau non tunai. Nilai lain ditolak
     * di server supaya tidak ada order dengan metode yang tidak dikenal.
     */
    private function validasiCaraBayar(Request $request): string
    {
        $data = $request->validate([
            'cara_bayar' => ['nullable', Rule::in([Order::BAYAR_TUNAI, Order::BAYAR_QRIS])],
        ], [], [
            'cara_bayar' => 'metode pembayaran',
        ]);

        return $data['cara_bayar'] ?? Order::BAYAR_QRIS;
    }

/**
 * Data penerima wajib lengkap sebelum lanjut ke pembayaran: nama dan
     * ruangan menentukan ke mana jajan diantar, kelas/jurusan/kode jadi
     * petunjuk tambahan untuk petugas.
     *
     * Nilai yang tetap dikirim tapi tidak ada di daftar tetap ditolak,
     * supaya tidak muncul "XI RPL A" yang bedanya cuma spasi.
     *
     * @return array{nama: string, tingkat: string, jurusan: string, kode_kelas: string, ruang: string}
     */
    private function validasiPenerima(Request $request): array
    {
        // Spasi di awal/akhir dibuang dulu supaya "   " tetap dianggap
        // kosong oleh aturan required, bukan lolos sebagai isian sah.
        $request->merge([
            'penerima' => collect($request->input('penerima') ?? [])
                ->map(fn ($nilai) => is_string($nilai) ? trim($nilai) : $nilai)
                ->all(),
        ]);

        $data = $request->validate([
            'penerima' => ['required', 'array'],
            'penerima.nama' => ['required', 'string', 'max:120'],
            'penerima.tingkat' => ['required', Rule::enum(TingkatKelas::class)],
            'penerima.jurusan' => ['required', Rule::enum(Jurusan::class)],
            'penerima.kode_kelas' => ['required', Rule::enum(KodeKelas::class)],
            'penerima.ruang' => ['required', 'string', 'max:60'],
        ], [], [
            'penerima' => 'data penerima',
            'penerima.nama' => 'nama penerima',
            'penerima.tingkat' => 'tingkat kelas',
            'penerima.jurusan' => 'jurusan',
            'penerima.kode_kelas' => 'kode kelas',
            'penerima.ruang' => 'nama ruangan',
        ]);

        $penerima = $data['penerima'];

        return [
            // Huruf besar di depan supaya rapi di daftar antrean admin.
            'nama' => Str::title($penerima['nama']),
            'tingkat' => $penerima['tingkat'],
            'jurusan' => $penerima['jurusan'],
            'kode_kelas' => $penerima['kode_kelas'],
            'ruang' => Str::upper($penerima['ruang']),
        ];
    }

    /**
     * Keranjang datang dari browser, jadi harga dan stok tidak boleh
     * dipercaya. Ambil ulang dari database, jumlah dipotong sesuai stok
     * yang benar-benar tersedia. Produk habis dibuang.
     *
     * @param  array<int, mixed>  $cart
     * @return array<int, array<string, mixed>>
     */
    private function susunCart(array $cart): array
    {
        $minta = collect($cart)
            ->mapWithKeys(fn ($item) => [(int) ($item['id'] ?? 0) => (int) ($item['jumlah'] ?? 0)])
            ->filter(fn ($jumlah, $id) => $id > 0 && $jumlah > 0);

        if ($minta->isEmpty()) {
            return [];
        }

        $produk = Product::query()
            ->whereIn('id', $minta->keys())
            ->get()
            ->keyBy('id');

        $hasil = [];

        foreach ($minta as $id => $jumlah) {
            $p = $produk->get($id);

            if (! $p || ! $p->tersedia || $p->habis) {
                continue;
            }

            $hasil[] = [
                'id' => $p->id,
                'nama' => $p->nama,
                'harga' => $p->harga,
                'jumlah' => min($jumlah, $p->stok),
                'stok' => $p->stok,
                'gambar' => $p->foto_fallback,
            ];
        }

        return $hasil;
    }

    /**
     * Keranjang milik siswa yang sedang login, diambil dari database.
     *
     * Tidak lagi dari session: begitu siswa login, isi keranjangnya
     * ikut ke akun, jadi ganti HP atau clears cache tidak menghilangkan
     * jajan yang sudah dipilih.
     *
     * @return list<array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}>
     */
    private function keranjangSiswa(Request $request): array
    {
        return $request->user('siswa')->keranjang()->firstOrCreate()->isi();
    }

    /**
     * Kosongkan keranjang siswa yang sedang login.
     *
     * Hanya untuk halaman yang dilindungi guard `siswa`. Kalau session
     * sudah tidak ada (mis. cookie kedaluwarsa di tengah alur), diam-diam
     * dilewati: lebih baik keranjang tidak terkosongkan daripada fatal error
     * yang menggagalkan pembayaran yang sedang diproses.
     */
    private function kosongkanKeranjang(Request $request): void
    {
        // `first()`, bukan `firstOrCreate()`: mengosongkan keranjang tidak
        // perlu membuat baris baru kalau memang belum pernah dibuat.
        $request->user('siswa')?->keranjang()->first()?->kosongkan();
    }

    /**
     * Buat order beserta rinciannya. Data penerima diambil dari session
     * yang sudah divalidasi `prepare()`, jadi di sini tidak perlu
     * memvalidasi ulang -- kalaurones tidak lengkap, `index()` sudah
     * mengembalikan siswa ke halaman keranjang.
     *
     * Order tunai langsung Lunas, QRIS menunggu callback pembayaran.
     */
    private function buatOrder(Request $request, array $cart, int $total, ?string $metodeBayar = null): Order
    {
        $metodeBayar ??= Order::BAYAR_QRIS;
        $tunai = $metodeBayar === Order::BAYAR_TUNAI;
        $penerima = $request->session()->get('penerima', []);

        return DB::transaction(function () use ($request, $cart, $total, $metodeBayar, $tunai, $penerima) {
            $order = Order::create([
                'siswa_id' => $request->user('siswa')->id,
                'nama' => $penerima['nama'],
                'tingkat' => $penerima['tingkat'] ?? null,
                'jurusan' => $penerima['jurusan'] ?? null,
                'kode_kelas' => $penerima['kode_kelas'] ?? null,
                'ruang' => $penerima['ruang'],
                'cara_ambil' => Order::CARA_AMBIL_ANTAR,
                'metode_bayar' => $metodeBayar,
                'status' => $tunai ? StatusOrder::Lunas : StatusOrder::MenungguBayar,
                'total' => $total,
                'midtrans_order_id' => $this->midtransOrderId(),
                'batas_bayar' => $tunai ? null : now()->addMinutes(30),
            ]);

            foreach ($cart as $item) {
                $order->items()->create([
                    'product_id' => $item['id'],
                    'nama' => $item['nama'],
                    'harga' => $item['harga'],
                    'jumlah' => $item['jumlah'],
                    'subtotal' => $item['harga'] * $item['jumlah'],
                ]);
            }

            return $order;
        });
    }

    /**
     * Potong stok sesuai rincian pesanan. Dipanggil hanya setelah pembayaran
     * QRIS terkonfirmasi, supaya barang tidak tertahan kalau pembeli menekan
     * "batal" di popup Midtrans.
     */
    private function kurangiStok(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            Product::where('id', $item->product_id)
                ->where('stok', '>=', $item->jumlah)
                ->decrement('stok', $item->jumlah);
        }
    }

    /**
     * Tandai QRIS sudah dibayar. Idempoten: Midtrans bisa mengirim callback
     * lebih dari sekali, jadi stok hanya dipotong pada transisi status
     * pertama dari MenungguBayar ke Lunas.
     *
     * Order yang barusan ditransisikan dikembalikan supaya pemanggil bisa
     * tahu siapa pemiliknya. Callback kedua untuk order yang sama
     * mengembalikan null, karena tidak ada transisi baru.
     */
    private function tandaiLunas(?string $midtransOrderId): ?Order
    {
        if (blank($midtransOrderId)) {
            return null;
        }

        $order = Order::where('midtrans_order_id', $midtransOrderId)->first();

        if (! $order || $order->status !== StatusOrder::MenungguBayar) {
            return null;
        }

        $order->update([
            'status' => StatusOrder::Lunas,
            'batas_bayar' => null,
        ]);

        $this->kurangiStok($order);

        return $order;
    }

    /**
     * Minta snap token ke Midtrans. Null berarti transaksi tidak pernah
     * dibuat, jadi pemanggil boleh membuang order-nya tanpa sisa.
     */
    private function createMidtransTransaction(Order $order, int $total): ?string
    {
        $order->loadMissing('items');

        try {
            $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')
                ->post($this->midtransApiUrl().'/snap/v1/transactions', [
                    'transaction_details' => [
                        'order_id' => $order->midtrans_order_id,
                        'gross_amount' => $total,
                    ],
                    'customer_details' => [
                        'first_name' => Str::limit($order->nama, 40, ''),
                    ],
                    'item_details' => $order->items->map(fn ($item) => [
                        'id' => (string) $item->product_id,
                        'price' => $item->harga,
                        'quantity' => $item->jumlah,
                        'name' => Str::limit($item->nama, 40, ''),
                    ])->all(),
                ]);
        } catch (\Throwable $e) {
            Log::error('Gagal menghubungi Midtrans saat membuat transaksi', [
                'order' => $order->midtrans_order_id,
                'pesan' => $e->getMessage(),
            ]);

            return null;
        }

        if (! $response->successful()) {
            Log::error('Midtrans menolak pembuatan transaksi', [
                'order' => $order->midtrans_order_id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $token = $response->json('token');

        return filled($token) ? $token : null;
    }

    /**
     * Tanya status ke Midtrans. Halaman `finish` dipanggil dari browser,
     * jadi statusnya dicek ulang ke server; query string tidak dipercaya
     * sebagai bukti pembayaran.
     */
    private function sudahTerbayar(?string $midtransOrderId): bool
    {
        if (blank($midtransOrderId)) {
            return false;
        }

        try {
            $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')
                ->get($this->midtransApiUrl().'/v2/'.$midtransOrderId.'/status');
        } catch (\Throwable $e) {
            Log::warning('Gagal cek status ke Midtrans', [
                'order' => $midtransOrderId,
                'pesan' => $e->getMessage(),
            ]);

            return false;
        }

        if (! $response->successful()) {
            return false;
        }

        $status = $response->json('transaction_status');
        $fraud = $response->json('fraud_status');

        return in_array($status, ['capture', 'settlement'], true)
            && ($fraud === 'accept' || $fraud === null);
    }

    private function midtransApiUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }

    private function midtransOrderId(): string
    {
        return 'foodrink-'.Str::lower(Str::random(12));
    }

    /**
     * Cari pesanan milik siswa yang sedang login. `order_id` dari Midtrans
     * dipakai dulu karena itu yang dikirim balik saat pembayaran, lalu kode
     * struk internal sebagai cadangan.
     *
     * Ownership dicek lewat siswa_id, bukan daftar kode di session: begitu
     * siswa punya akun, halamannya berlaku di perangkat mana pun, bukan
     * cuma browser yang dipakai saat memesan.
     */
    private function cariOrder(Request $request): ?Order
    {
        $orderId = $request->query('order_id');
        $kode = $request->query('kode');
        $siswaId = $request->user('siswa')?->id;

        $cari = fn (?string $kolom, ?string $nilai) => filled($nilai)
            ? Order::with('items')->where($kolom, $nilai)->first()
            : null;

        $order = $cari('midtrans_order_id', $orderId) ?? $cari('kode', $kode);

        // Nomor pesanan orang lain tidak boleh terbuka hanya karena
        // kebetulan ditebak atau bocor dari riwayat browser lain.
        if (! $order || $order->siswa_id !== $siswaId) {
            return null;
        }

        return $order;
    }

    private function snapUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
    }
}
